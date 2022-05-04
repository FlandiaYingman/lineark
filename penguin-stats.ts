const _ = require('lodash')
const fetch = require('node-fetch')

type Server = 'CN' | 'JP' | 'US' | 'KR'
type Language = 'zh' | 'ja' | 'en' | 'ko'

// I18N string
type I18N = Map<Language, string>

export class Item {
  // rawItem is the raw item from the Penguin Stats API
  constructor (rawItem: any) {
    this.names = rawItem.name_i18n
    this.id = rawItem.itemId
  }

  names: I18N
  id: string
}

export class Zone {
  // rawZone is the raw zone from the Penguin Stats API
  constructor (rawZone: any) {
    this.names = rawZone.zoneName_i18n
    this.id = rawZone.zoneId

    this.existence = rawZone.existence
  }

  names: I18N
  id: string

  existence: Map<Server, { exists: boolean, openTime: Date, closeTime: Date }>
}

export class Stage {
  // rawStage is the raw stage from the Penguin Stats API
  // Note that after construction, estimatedDrops shall be filled manually.
  constructor (rawStage: any, zoneMap: Map<string, Zone>) {
    this.codes = rawStage.code_i18n
    this.id = rawStage.stageId
    this.cost = rawStage.apCost

    this.zone = zoneMap[rawStage.zoneId]
  }

  zone: Zone

  codes: I18N
  id: string
  cost: number
}

export class Drop {
  // rawMatrix is the raw drop matrix from the Penguin Stats API
  constructor (rawMatrix: any, itemMap: Map<string, Item>, stageMap: Map<string, Stage>) {
    this.item = itemMap[rawMatrix.itemId]
    this.stage = stageMap[rawMatrix.stageId]
    this.dropCount = rawMatrix.quantity
    this.sampleCount = rawMatrix.times
  }

  item: Item
  stage: Stage

  dropCount: number
  sampleCount: number
}

export type RawData = { rawItems: any, rawZones: any, rawStages: any, rawMatrix: any }
export type Data = { items: Map<string, Item>, zones: Map<string, Zone>, stages: Map<string, Stage>, drops: Map<string, Drop[]> }

// fetches the data from the Penguin Stats API. returning the raw data as-is from the API.
export async function fetchData ():
  Promise<RawData> {
  const [rawItems, rawZones, rawStages, rawMatrix] = await Promise.all([
    fetch(`https://penguin-stats.io/PenguinStats/api/v2/items`).then(res => res.json()),
    fetch(`https://penguin-stats.io/PenguinStats/api/v2/zones`).then(res => res.json()),
    fetch(`https://penguin-stats.io/PenguinStats/api/v2/stages`).then(res => res.json()),
    fetch(`https://penguin-stats.io/PenguinStats/api/v2/result/matrix`).then(res => res.json())
  ])
  return { rawItems, rawZones, rawStages, rawMatrix }
}

// loads the raw data from the Penguin Stats API and returns the processed data map.
export function loadData ({ rawItems, rawZones, rawStages, rawMatrix }: RawData):
  Data {
  const items = _.keyBy(rawItems.map(raw => Object.freeze(new Item(raw))), 'id')
  const zones = _.keyBy(rawZones.map(raw => Object.freeze(new Zone(raw))), 'id')
  const stages = _.keyBy(rawStages.map(raw => Object.freeze(new Stage(raw, zones))), 'id')
  const drops = _.groupBy(rawMatrix['matrix'].map(raw => Object.freeze(new Drop(raw, items, stages))), 'stage.id')
  return {
    items, zones, stages, drops
  }
}
