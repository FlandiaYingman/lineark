import { Data, Item, Stage, Language} from './penguin-stats'
import _, { Dictionary } from 'lodash'
import solver from 'javascript-lp-solver'

export class OptimizeResult {

  constructor (result: any, itemMap: Dictionary<Item>, stageMap: Dictionary<Stage>) {
    Object.entries(result).forEach(([key, value]) => {
      if (key in ['feasible', 'bounded', 'isIntegral', 'depot', 'result']) return
      if (key in stageMap) this.farms.set(stageMap[key], Math.ceil(value as number))
      if (key in itemMap) this.synthesizes.set(itemMap[key], Math.ceil(value as number))
    })
    this.sanity = _.sumBy([...this.farms.entries()], ([stage, count]) => stage.cost * count)
  }

  sanity: number
  farms: Map<Stage, number> = new Map()
  synthesizes: Map<Item, number> = new Map()

  toString (language: Language): string {
    const obj = { sanityCost: this.sanity }
    this.farms.forEach((value, key) => {
      obj[key.codes[language]] = value
    })
    this.synthesizes.forEach((value, key) => {
      obj[key.names[language]] = value
    })
    return JSON.stringify(obj, null, 2)
  }
}

export class OptimizeOption {
  // If true, the optimizer will try to find the exact best integer solution for the problem.
  //
  // For example, A stage drops 3 item with 20 AP cost, B stage drops 1 item with 10 AP cost;  we want to get 10 items,
  // and the option is set to true. The result will be 3 times A stage and 1 times B stage;
  // the total sanity cost is 3 * 20 + 1 * 10 = 70. However, this is not the long-term optimal solution,
  // because the 3 drops stage is always better than the 1 drops stage.
  exactInt: boolean = false
}

export function solve (
  needs: Map<string, number>,
  haves: Map<string, number>,
  data: Data,
  option: OptimizeOption = new OptimizeOption()
): OptimizeResult {
  // to solve the problem, we have to find the minimum sanity cost of the following variables and constraints:
  //
  // variables:
  //   each variable name is a stage id or synthesis outcome id;
  //   consumed items are represented by a negative number;
  //   produced items are represented by a positive number;
  //   the sanity cost is represented by a positive number;
  //   synthesis steps have extremely low sanity cost, which prevents synthesizing unused items.
  //
  //   special variable: 'depot_var', costs exactly one special item 'depot_con', and produce all the items in the depot.
  //   it represents the items in the depot.
  //
  // constraints:
  //   the sanity cost must be non-negative;
  //   all the items must be non-negative; we can't loan in the terra world :D
  //   all the needed items must be produced (minimum = item needed count).
  //
  //   special constraint: 'depot_con' must be exactly one, which represents the items in the depot (see above).

  const variables = {}
  const ints = {}

  // special depot; see above
  const depot = { depot_count: 1 }
  // add a function to simulate the items in depot, which we had already
  haves.forEach((haveItemCount, haveItemID) => {depot[haveItemID] = haveItemCount})
  variables['depot'] = depot

  // the linear functions for stage drops;
  // costs the corresponded sanity and produces the estimated drop items
  for (const [stageID, drops] of Object.entries(data.drops)) {
    const variable = { 'cost': data.stages[stageID].cost }
    drops.forEach(drop => {variable[drop.item.id] = drop.dropCount / drop.sampleCount})

    if (option.exactInt) {
      // we can only farm a stage integer times
      // see exactInt comment for more information
      ints[stageID] = 1
    }

    variables[stageID] = variable
  }

  // add the linear functions for synthesis outcomes;
  // costs the corresponded materials and produces the outcome item
  for (const [outcomeItemID, synthesize] of Object.entries(data.synthesizes)) {
    const variable = { 'cost': synthesize.cost }
    // negative for consumed material items
    synthesize.materials.forEach(material => {variable[material.item.id] = -material.count})

    // positive for produced outcome items
    variable[outcomeItemID] = +1

    // we can only synthesize an item integer times
    ints[outcomeItemID] = 1

    variables[outcomeItemID] = variable
  }

  const constraints = {
    // special depot_count constraint; see above
    'depot_count': { 'equal': 1 },
    // sanity cost must be non-negative
    'cost': { 'min': 0 }
  }
  // all the items must be non-negative
  for (const [itemID,] of Object.entries(data.items)) {
    constraints[itemID] = { 'min': 0 }
  }
  // all the needed items must be produced (minimum = item needed count)
  needs.forEach((needItemCount, needItemID) => {
    constraints[needItemID] = { 'min': needItemCount }
  })

  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: constraints,
    variables: variables,
    ints: ints
  }

  const result = solver.Solve(model)

  return new OptimizeResult(result, data.items, data.stages)
}

export function importFrom (json: string) {
  const raw = JSON.parse(json)
  const needs = {}
  const haves = {}
  switch (raw['@type']) {
    case '@penguin-statistics/planner/config':
      raw.items.forEach(item => {
        if (item.need) needs[item.id] = item.need
        if (item.have) haves[item.id] = item.have
      })
      break
    default:
      throw new Error(`invalid config: expected @type to be @penguin-statistics/planner/config, got '${raw['@type']}'`)
  }
  return { needs, haves }
}
