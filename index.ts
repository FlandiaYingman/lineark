import { fetchData, loadData } from './penguin-stats'
import { solve } from './solver'

// needed items. format: (itemID: count)
const needs = { '30012': 100 }
// had items. format: (itemID: count)
const haves = { '30012': 50 }

const init = new Date()
fetchData().then(raw => {
  const fetched = new Date()
  console.log('lineark: fetched data in', fetched.getTime() - init.getTime(), 'ms')

  const data = loadData(raw)
  const loaded = new Date()
  console.log('lineark: loaded data in', loaded.getTime() - fetched.getTime(), 'ms')

  solve(new Map(Object.entries(needs)), new Map(Object.entries(haves)), data)
  const solved = new Date()
  console.log('lineark: solved in', solved.getTime() - loaded.getTime(), 'ms')
})