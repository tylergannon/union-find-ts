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
import { concat, groupBy, lift } from 'ramda'
import { unionFind, toConnectedGroups } from 'union-find-ts'

enum Center {
    Head = 1,
    Ajna,
    Throat,
    Identity,
    Sacral,
    Root,
    Spleen,
    Will,
    ESP
}
interface TestInterface {
    num: number
    connected: number[]
    center: Center
}
const allItems: TestInterface[] = [
    { num: 41, center: Center.Root, connected: [30] },
    { num: 19, center: Center.Root, connected: [49] },
    { num: 13, center: Center.Identity, connected: [33] },
    { num: 49, center: Center.ESP, connected: [19] },
    { num: 30, center: Center.ESP, connected: [41] },
    { num: 55, center: Center.ESP, connected: [39] },
    { num: 37, center: Center.ESP, connected: [40] },
    { num: 63, center: Center.Head, connected: [4] },
    { num: 22, center: Center.ESP, connected: [12] },
    { num: 36, center: Center.ESP, connected: [35] },
    { num: 25, center: Center.Identity, connected: [51] },
    { num: 17, center: Center.Ajna, connected: [62] },
    { num: 21, center: Center.Will, connected: [45] },
    { num: 51, center: Center.Will, connected: [26] },
    { num: 42, center: Center.Sacral, connected: [53] },
    { num: 3, center: Center.Sacral, connected: [60] },
    { num: 27, center: Center.Sacral, connected: [50] },
    { num: 24, center: Center.Ajna, connected: [61] },
    { num: 2, center: Center.Identity, connected: [14] },
    { num: 23, center: Center.Throat, connected: [43] },
    { num: 8, center: Center.Throat, connected: [1] },
    { num: 20, center: Center.Throat, connected: [10, 57, 34] },
    { num: 16, center: Center.Throat, connected: [48] },
    { num: 35, center: Center.Throat, connected: [36] },
    { num: 45, center: Center.Throat, connected: [21] },
    { num: 12, center: Center.Throat, connected: [22] },
    { num: 15, center: Center.Identity, connected: [5] },
    { num: 52, center: Center.Root, connected: [9] },
    { num: 39, center: Center.Root, connected: [55] },
    { num: 53, center: Center.Root, connected: [42] },
    { num: 62, center: Center.Throat, connected: [17] },
    { num: 56, center: Center.Throat, connected: [11] },
    { num: 31, center: Center.Throat, connected: [7] },
    { num: 33, center: Center.Throat, connected: [13] },
    { num: 7, center: Center.Identity, connected: [31] },
    { num: 4, center: Center.Ajna, connected: [63] },
    { num: 29, center: Center.Sacral, connected: [46] },
    { num: 59, center: Center.Sacral, connected: [6] },
    { num: 40, center: Center.Will, connected: [37] },
    { num: 64, center: Center.Head, connected: [47] },
    { num: 47, center: Center.Ajna, connected: [64] },
    { num: 6, center: Center.ESP, connected: [59] },
    { num: 46, center: Center.Identity, connected: [29] },
    { num: 18, center: Center.Spleen, connected: [58] },
    { num: 48, center: Center.Spleen, connected: [16] },
    { num: 57, center: Center.Spleen, connected: [34, 10, 20] },
    { num: 32, center: Center.Spleen, connected: [54] },
    { num: 50, center: Center.Spleen, connected: [27] },
    { num: 28, center: Center.Spleen, connected: [36] },
    { num: 44, center: Center.Spleen, connected: [26] },
    { num: 1, center: Center.Identity, connected: [8] },
    { num: 43, center: Center.Ajna, connected: [23] },
    { num: 14, center: Center.Sacral, connected: [2] },
    { num: 34, center: Center.Sacral, connected: [57, 10, 20] },
    { num: 9, center: Center.Sacral, connected: [52] },
    { num: 5, center: Center.Sacral, connected: [15] },
    { num: 26, center: Center.Will, connected: [44] },
    { num: 11, center: Center.Ajna, connected: [56] },
    { num: 10, center: Center.Identity, connected: [20, 57, 34] },
    { num: 58, center: Center.Root, connected: [18] },
    { num: 38, center: Center.Root, connected: [28] },
    { num: 54, center: Center.Root, connected: [32] },
    { num: 61, center: Center.Head, connected: [24] },
    { num: 60, center: Center.Root, connected: [3] }
]
const gates = [
    20, 34, 63, 64, 55, 24, 53, 20, 17, 6, 52, 57, 7, 59, 55, 37, 40, 52, 40, 64, 31, 21, 46, 39,
    57, 4
]
const gatesByCenter = groupBy(item => item.center.toString(), allItems)
const gateNumbers: Set<number> = new Set(gates)
const gateNum = ({ num }: TestInterface) => num
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
