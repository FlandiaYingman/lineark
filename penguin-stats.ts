import _, { Dictionary } from 'lodash'
import fetch from 'node-fetch'

export type Server = 'CN' | 'JP' | 'US' | 'KR'
export type Language = 'zh' | 'ja' | 'en' | 'ko'

// I18N string
type I18N = Map<Language, string>

export class Item {
  // rawItem is the raw item from the Penguin Stats API
  constructor (rawItem: any) {
    this.names = rawItem['name_i18n']
    this.id = rawItem['itemId']
  }

  names: I18N
  id: string
}

export class Zone {
  // rawZone is the raw zone from the Penguin Stats API
  constructor (rawZone: any) {
    this.names = rawZone['zoneName_i18n']
    this.id = rawZone['zoneId']

    this.existence = rawZone.existence
  }

  names: I18N
  id: string

  existence: Map<Server, { exist: boolean, openTime: Date, closeTime: Date }>
}

export class Stage {
  // rawStage is the raw stage from the Penguin Stats API
  // Note that after construction, estimatedDrops shall be filled manually.
  constructor (rawStage: any, zoneMap: Dictionary<Zone>) {
    this.codes = rawStage['code_i18n']
    this.id = rawStage['stageId']
    this.cost = rawStage['apCost']

    this.zone = zoneMap[rawStage['zoneId']]
  }

  zone: Zone

  codes: I18N
  id: string
  cost: number
}

export class Drop {
  // rawMatrix is the raw drop matrix from the Penguin Stats API
  constructor (rawMatrix: any, itemMap: Dictionary<Item>, stageMap: Dictionary<Stage>) {
    this.item = itemMap[rawMatrix['itemId']]
    this.stage = stageMap[rawMatrix['stageId']]
    this.dropCount = rawMatrix['quantity']
    this.sampleCount = rawMatrix['times']
  }

  item: Item
  stage: Stage

  dropCount: number
  sampleCount: number
}

export class Synthesize {

  constructor (rawSynthesize: any, itemMap: Dictionary<Item>) {
    this.outcome = itemMap[rawSynthesize.id]
    this.extraOutcome = rawSynthesize.extraOutcome.map(raw =>
      ({ item: itemMap[raw.id], probability: raw['weight'] / rawSynthesize['totalWeight'] })
    )
    // multiply (36 / 10000) as the CE-6 sanity-gold coefficient
    // multiply (0.5), since the infra produces gold. we take 0.5 as an approximation as the infra-CE-6 coefficient
    // multiply (4 / 7), since only 4 / 7 of the days that CE-6 is open
    this.cost = rawSynthesize.goldCost * (36 / 10000) * (0.5) * (4 / 7)
    this.goldCost = rawSynthesize.goldCost
    this.materials = rawSynthesize['costs'].map(raw =>
      ({ item: itemMap[raw.id], count: raw.count })
    )
  }

  outcome: Item
  extraOutcome: { item: Item, probability: number }[]

  cost: number
  goldCost: number

  materials: { item: Item, count: number }[]
}

export type RawData = {
  rawItems: any[],
  rawZones: any[],
  rawStages: any[],
  rawMatrix: { matrix: any[] },
  rawFormula: any[],
}
export type Data = {
  items: Dictionary<Item>,
  zones: Dictionary<Zone>,
  stages: Dictionary<Stage>,
  drops: Dictionary<Drop[]>,
  synthesizes: Dictionary<Synthesize>,
}

// fetches the data from the Penguin Stats API. returning the raw data as-is from the API.
export async function fetchData (): Promise<RawData> {
  const [rawItems, rawZones, rawStages, rawMatrix, rawFormula] = await Promise.all([
    fetch(`https://penguin-stats.cn/PenguinStats/api/v2/items`).then(res => res.json()),
    fetch(`https://penguin-stats.cn/PenguinStats/api/v2/zones`).then(res => res.json()),
    fetch(`https://penguin-stats.cn/PenguinStats/api/v2/stages`).then(res => res.json()),
    fetch(`https://penguin-stats.cn/PenguinStats/api/v2/result/matrix`).then(res => res.json()),
    fetch(`https://penguin-stats.cn/PenguinStats/api/v2/formula`).then(res => res.json()),
  ])
  return { rawItems, rawZones, rawStages, rawMatrix, rawFormula }
}

// loads the raw data from the Penguin Stats A  PI and returns the processed data map.
export function loadData ({ rawItems, rawZones, rawStages, rawMatrix, rawFormula }: RawData): Data {
  const items = _.keyBy(rawItems.map(raw => Object.freeze(new Item(raw))), 'id')
  const zones = _.keyBy(rawZones.map(raw => Object.freeze(new Zone(raw))), 'id')
  const stages = _.keyBy(rawStages.map(raw => Object.freeze(new Stage(raw, zones))), 'id')
  const drops = _.groupBy(rawMatrix.matrix.map(raw => Object.freeze(new Drop(raw, items, stages))), 'stage.id')

  const synthesizes = _.keyBy(rawFormula.map(raw => Object.freeze(new Synthesize(raw, items))), 'outcome.id')
  return { items, zones, stages, drops, synthesizes }
}

export function filterData (data: Data, server: Server): Data {
  for (let [stageID, stage] of Object.entries(data.stages)) {
    let inTimeRange = true
    const openTime = stage.zone.existence[server].openTime
    const closeTime = stage.zone.existence[server].closeTime
    if (openTime)
      inTimeRange = ((new Date().getTime()) >= openTime) && inTimeRange
    if (closeTime)
      inTimeRange = ((new Date().getTime()) <= closeTime) && inTimeRange
    if (!stage.zone.existence[server].exist || !inTimeRange) {
      delete data.zones[stage.zone.id]
      delete data.stages[stageID]
    }
  }
  for (let [stageID, drops] of Object.entries(data.drops)) {
    drops = drops.filter(drop => drop.sampleCount >= 100)
    if (drops.length > 0) {
      data.drops[stageID] = drops
    } else {
      delete data.drops[stageID]
    }
  }
  return data
}
