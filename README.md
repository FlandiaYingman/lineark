# Lineark

Lineark is a tool for solving linear programming problems of the game Arknights.

The name 'lineark' is a combination of the words 'linear' and 'ark' (Arknights).

**Status** (2022/05/04): Basically _usable_ 🆗 , but still need to be _tested_ and _improved_.

## Usage

### Install

1. Clone the repository.
2. Run `npm install`.

### Run

3. Modify the `needs` and `haves` in the `index.ts` file.
4. Run `npm run run`.

### Input / Output

In the `index.ts` file, we have:

```ts
// needed items. format: (itemID: count)
const needs = { '30012': 100 }
// had items. format: (itemID: count)
const haves = { '30012': 50 }
```

Just modify it to specify input.

The output of the above input is:

```json5
{
  '30012': 1,
  feasible: true,
  result: 240.10285714,
  bounded: true,
  isIntegral: true,
  'main_01-07': 40,
  depot: 1
}
```

You can ignore `bounded`, `isIntegral` and `depot`.

- `feasible` represetns whether the problem is feasible.
- `result` is the estimated sanity cost.
- `main_01-07` is the times you want to farm a certain stage (which `main_01-07` is the stage ID).
- `30012` is the times you want to synthesize a certain item (which `30012` is the synthesis result item ID).

Note that the synthesis LMB cost is converted into a small sanity cost, so `result` is possible to be a non-integer.

## Acknowledgements

Thanks to [ycremar/ArkPlanner](https://github.com/ycremar/ArkPlanner) for the idea.

Thanks to [javascript-lp-solver](https://github.com/JWally/jsLPSolver) for providing such a great LP library.