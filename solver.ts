import { Data } from './penguin-stats'

const solver = require('javascript-lp-solver/src/solver')

export function solve (needs: Map<string, number>, haves: Map<string, number>, data: Data) {
  // to solve the problem, we have to find the minimum sanity cost of the following variables and constraints:
  //
  // variables:
  //   each variable is a stage or synthesis step;
  //   consumed items are represented by a negative number;
  //   produced items are represented by a positive number;
  //   the sanity cost is represented by a positive number;
  //   synthesis steps have extremely low sanity cost, which prevents synthesizing unused items.
  //
  //   special variable: 'depot_var', costs exactly one special item 'depot_con', and produce all the items in the depot.
  //   it represents the items in the depot.
  //
  // constraints:
  //   all the items must be non-negative;
  //   the cost must be non-negative;
  //
  //   special constraints: 'depot_con' must be exactly one, which represents the items in the depot (see above).

  const variables = {}
  const ints = {}

  const depot = { depot_count: 1 }
  haves.forEach((haveItemCount, haveItemID) => {
    depot[haveItemID] = haveItemCount
  })
  variables['depot'] = depot

  for (const [stageID, drops] of Object.entries(data.drops)) {
    const variable = { 'cost': data.stages[stageID].cost }
    drops.forEach(drop => {variable[drop.item.id] = drop.dropCount / drop.sampleCount})

    variables[stageID] = variable
    ints[stageID] = 1
  }

  const constraints = {
    'depot_count': { 'equal': 1 },
    'cost': { 'min': 0 }
  }
  for (const [itemID,] of Object.entries(data.items)) {
    const constraint = { 'min': 0 }
    constraints[itemID] = constraint
  }
  needs.forEach((needItemCount, needItemID) => {
    const constraint = { 'min': needItemCount }
    constraints[needItemID] = constraint
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