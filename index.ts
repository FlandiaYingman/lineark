import { fetchData, loadData } from './penguin-stats'
import { solve } from './solver'

fetchData().then(raw => {
  const data = loadData(raw)
  let needs = new Map(Object.entries({ '30012': 100 })) as Map<string, number>
  let haves = new Map(Object.entries({ '30012': 50 })) as Map<string, number>
  solve(needs, haves, data)
})