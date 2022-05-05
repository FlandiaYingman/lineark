# Lineark

Lineark is a tool for solving linear programming problems of the game Arknights.

The name 'lineark' is a combination of the words 'linear' and 'ark' (Arknights).

**Status** (2022/05/04): Basically _usable_ 🆗 , but still need to be _tested_ and _improved_.

## Usage

### Install

1. Just clone the repository.

### Run

3. Modify the `needs` and `haves` in the `index.ts` file.
4. Run `yarn run run`.

### Input / Output

In the `index.ts` file, we have:

```ts
// needed items. format: {[itemID: string]: [count: number]}
let needs: any = { '30012': 100 }
// had items. format: {[itemID: string]: [count: number]}
let haves: any = { '30012': 50 }

// the penguin-stats planner compatible config JSON. if it's not null or undefined, it will be used instead of the needs and haves. 
const importStr = `{"@type":"@penguin-statistics/planner/config","items":[{"id":"30135","have":1},{"id":"30125","have":1},{"id":"30115","have":3,"need":4},{"id":"30073","have":2},{"id":"30084","have":2,"need":6},{"id":"30083","have":3},{"id":"30094","have":12},{"id":"30093","have":64},{"id":"30104","have":1},{"id":"30103","have":2},{"id":"30013","have":2},{"id":"30012","have":4},{"id":"30011","have":2},{"id":"30063","have":52},{"id":"30062","have":69},{"id":"30061","have":35},{"id":"30034","have":9},{"id":"30033","have":13},{"id":"30032","have":35},{"id":"30031","have":87},{"id":"30024","have":9},{"id":"30022","have":18},{"id":"30021","have":49},{"id":"30044","have":1},{"id":"30042","have":10},{"id":"30041","have":6},{"id":"30054","have":1},{"id":"30053","have":43},{"id":"30052","have":61},{"id":"30051","have":68},{"id":"31014","have":4},{"id":"31013","have":43},{"id":"31024","have":3},{"id":"31023","have":61},{"id":"30145","have":1},{"id":"31034","have":5},{"id":"31033","have":17}],"options":{"byProduct":false,"requireExp":false,"requireLmb":false},"excludes":[]}`
```

Just modify them to specify the input.

The output of the above input is:

```json5
{
  "sanityCost": 246,
  "GT-5": 5,
  "SN-9": 7,
  "1-7": 4,
  "固源岩": 1,
  "固源岩组": 2,
  "提纯源岩": 1,
  "三水锰矿": 4,
  "聚合剂": 1
}

```

- `sanityCost` represents the sanity cost of the solution.
- `GT-5`, `SN-9`, `1-7` are the times you want to farm a certain stage
  (which `GT-5` etc. are the stage code).
- `固源岩`, etc. are the times you want to synthesize a certain item
  (which `固源岩` etc. are the synthesis outcome item name).

## Acknowledgements

Thanks to [ycremar/ArkPlanner](https://github.com/ycremar/ArkPlanner) for the idea.

> 原理：将素材合成也看作一种掉落在约束中加以考虑（目标材料掉落1，消耗的材料掉落为-1），其cost为0或合成所需代币的等价体力消耗。

Thanks to [javascript-lp-solver](https://github.com/JWally/jsLPSolver) for providing such a great LP library.