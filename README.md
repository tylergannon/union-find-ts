# union-find-ts

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]


> An immutable Union-Find structure.

The main purpose of this structure is to simplify the search algorithm for finding
paths that join two previously disconnected components.

Not suitable for large data sets, since `find()` does not compress paths in-place and because
in order to achieve immutability, each `link` operation copies the data structure.

## Install

```bash
npm install union-find-ts
```

## Usage


```ts

const gates = [
    20, 34, 63, 64, 55, 24, 53, 20, 17, 6, 52, 57, 7, 59, 55, 37, 40, 52, 40, 64, 31, 21, 46, 39,
    57, 4
]
const gatesByCenter = groupBy(item => item.center.toString(), allItems)
const gateNumbers: Set<number> = new Set(gates)
const defined = gateNumbers.has.bind(gateNumbers)
const uf = unionFind(
    allItems,
    gateNum,
    /**
     * This is where we define which gates each one is connected to.
     * Each gate is connected to the other items on its center,
     * as well as the channel connection.
     * @param param0
     * @returns
     */
    ({ item: gate }) =>
        !defined(gate.num)
            ? []
            : [...gate.connected, ...gatesByCenter[gate.center.toString()].map(gateNum)].filter(
                    defined
                )
)
const groups = toConnectedGroups(uf)
expect(groups.length).toBe(2)
const findItemArray = lift(findItemByNum)

function candidates(item: TestInterface): TestInterface[] {
    return concat(findItemArray(item.connected), gatesByCenter[item.center.toString()])
}

const solution = findPath(uf, candidates, groups[1][0], groups[0][0])
const result = [[allItems.find(it => it.num === 62)]]
expect(solution.isJust()).toBeTruthy()
expect(solution.extract()).toEqual(result)
```

## Credits

This is a rewrite of [Union Find](https://github.com/mikolalysenko/union-find).
