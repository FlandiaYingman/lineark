import { Data } from './penguin-stats'

const solver = require('javascript-lp-solver/src/solver')

export function solve (needs: Map<string, number>, haves: Map<string, number>, data: Data) {
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

    // we can only farm a stage integer times
    ints[stageID] = 1

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

  console.log(result)
}