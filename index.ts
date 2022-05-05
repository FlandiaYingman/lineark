import { fetchData, filterData, loadData } from './penguin-stats'
import { importFrom, solve } from './solver'

// needed items. format: {[itemID: string]: [count: number]}
let needs: any = { '30012': 100 }
// had items. format: {[itemID: string]: [count: number]}
let haves: any = { '30012': 50 }

// the penguin-stats planner compatible config JSON. if it's not null or undefined, it will be used instead of the needs and haves.
const importStr = `{"@type":"@penguin-statistics/planner/config","items":[{"id":"30135","have":1},{"id":"30125","have":1},{"id":"30115","have":3,"need":4},{"id":"30073","have":2},{"id":"30084","have":2,"need":6},{"id":"30083","have":3},{"id":"30094","have":12},{"id":"30093","have":64},{"id":"30104","have":1},{"id":"30103","have":2},{"id":"30013","have":2},{"id":"30012","have":4},{"id":"30011","have":2},{"id":"30063","have":52},{"id":"30062","have":69},{"id":"30061","have":35},{"id":"30034","have":9},{"id":"30033","have":13},{"id":"30032","have":35},{"id":"30031","have":87},{"id":"30024","have":9},{"id":"30022","have":18},{"id":"30021","have":49},{"id":"30044","have":1},{"id":"30042","have":10},{"id":"30041","have":6},{"id":"30054","have":1},{"id":"30053","have":43},{"id":"30052","have":61},{"id":"30051","have":68},{"id":"31014","have":4},{"id":"31013","have":43},{"id":"31024","have":3},{"id":"31023","have":61},{"id":"30145","have":1},{"id":"31034","have":5},{"id":"31033","have":17}],"options":{"byProduct":false,"requireExp":false,"requireLmb":false},"excludes":[]}`

const init = new Date()
fetchData().then(raw => {
  const fetched = new Date()
  console.log('lineark: fetched data in', fetched.getTime() - init.getTime(), 'ms')

  const data = loadData(raw)
  const loaded = new Date()
  console.log('lineark: loaded data in', loaded.getTime() - fetched.getTime(), 'ms')

  if (importStr) {
    let i = importFrom(importStr)
    needs = i.needs
    haves = i.haves
  }

  const optimizeResult = solve(new Map(Object.entries(needs)), new Map(Object.entries(haves)), filterData(data, 'CN'))
  const solved = new Date()
  console.log('lineark: solved in', solved.getTime() - loaded.getTime(), 'ms')

  console.log(optimizeResult.toString('zh'))
})
