import { fetchData, loadData } from './penguin-stats'
import { solve } from './solver'

const init = new Date()
fetchData().then(raw => {
  const fetched = new Date()
  console.log('lineark: fetched data in', fetched.getTime() - init.getTime(), 'ms')

  const data = loadData(raw)
  let needs = new Map(Object.entries({ '30012': 100 })) as Map<string, number>
  let haves = new Map(Object.entries({ '30012': 50 })) as Map<string, number>
  const loaded = new Date()
  console.log('lineark: loaded data in', loaded.getTime() - fetched.getTime(), 'ms')

  solve(needs, haves, data)
  const solved = new Date()
  console.log('lineark: solved in', solved.getTime() - loaded.getTime(), 'ms')
})