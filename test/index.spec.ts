import { findPath, find, link, linkAll, toConnectedGroups, unionFind } from '../src'
import { concat, flatten, groupBy, lift, map } from 'ramda'
import { Maybe } from 'purify-ts'

expect.extend({
    toBeJust: <T>(actual: any, expected?: T) => {
        if (!Maybe.isMaybe<T>(actual)) {
            return { message: () => `Expected maybe but result was ${typeof actual}`, pass: false }
        }
        if (!actual.isJust()) {
            return {
                message: () => 'Expected Just but received Nothing.',
                pass: false
            }
        }
        if (!expected) {
            return {
                message: () => 'Expected Nothing but received Just.',
                pass: true
            }
        }
        if (actual.extract() === expected) {
            return {
                message: () => `Expected Just to not equal ${String(expected)} but it did.}`,
                pass: true
            }
        }
        return {
            message: () => `Expected Just to equal ${String(expected)} but got ${String(actual)}`,
            pass: false
        }
    }
})

describe('Union-Find', () => {
    describe('Building object', () => {
        it('It should be able to build an object', () => {
            const sorkin = unionFind(20, x => x)
            expect(sorkin.items).toHaveLength(21)
            expect(sorkin.ranks).toHaveLength(21)
            expect(sorkin.roots).toHaveLength(21)
        })

        it('Should create the object when given a list', () => {
            const uf = unionFind(allItems, ({ num }) => num)
            expect(uf.items).toHaveLength(65)
        })

        const mappings = [
            [40, 37],
            [40, 21],
            [37, 6],
            [6, 59],
            [34, 57],
            [57, 20],
            [6, 55],
            [55, 39],
            [59, 34]
        ]

        it('Should be able to create links', () => {
            let uf = unionFind(allItems, ({ num }) => num)
            expect(uf.items).toHaveLength(65)
            uf = mappings.reduce((uf1, [left, right]) => link(uf1, left, right), uf)
            const [head, ...tail] = map(it => find(uf, it), flatten(mappings))

            tail.forEach(() => {
                expect(head).toBeJust
            })
        })

        it('Should be able to create links during construction', () => {
            let uf = unionFind(
                allItems,
                ({ num }) => num,
                ({ item }) => {
                    return mappings.filter(it => item.num in it).map(([l, r]) => (l === item.num ? r : l))
                }
            )
            uf = mappings.reduce((uf1, [left, right]) => link(uf1, left, right), uf)
            const [head, ...tail] = map(it => find(uf, it), flatten(mappings))

            tail.forEach(t => {
                expect(head).toBe(t)
            })
        })
        describe('Component Joining', () => {
            it('items in each component should now have the same root.', () => {
                let uf = unionFind(allItems, gateNum, [
                    [1, 2],
                    [1, 3],
                    [1, 4],
                    [1, 5],
                    [6, 7],
                    [6, 8],
                    [6, 9],
                    [6, 10]
                ])
                const _find = (item: number) => find(uf, item)

                expect(_find(2)).toBe(_find(5))
                expect(_find(7)).toBe(_find(10))
                expect(_find(2)).not.toBe(_find(7))
                uf = link(uf, 1, 6)
                expect(_find(2)).toBe(_find(7))
                uf = linkAll(uf, 11, [12, 13, 14, 15, 16, 17, 18, 19, 20])
                console.log(uf.roots.slice(1, 21))
            })
        })
    })

    const gateNum = ({ num }: TestInterface) => num

    describe('grouping', () => {
        describe('Trivial Cases', () => {
            it('Gets the right answer if components already connected', () => {
                const uf = unionFind(3, x => x, [[2, 3]])
                const solution = findPath(uf, () => [1, 2, 3], 1, 2)
                expect(solution.isJust()).toBeTruthy()
            })
        })
        it('Connects one bigger.', () => {
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
            // console.log(groups)
            expect(groups.length).toBe(2)
            const findItemArray = lift(findItemByNum)

            function candidates(item: TestInterface): TestInterface[] {
                return concat(findItemArray(item.connected), gatesByCenter[item.center.toString()])
            }

            const solution = findPath(uf, candidates, groups[1][0], groups[0][0])
            const result = [[allItems.find(it => it.num === 62)]]
            console.log(`Expect: ${String(result)}\nActual: ${String(solution)}\n`)
            expect(solution.isJust()).toBeTruthy()
            expect(solution.extract()).toEqual(result)
        })

        it('Connects another larger example.', () => {
            const gates = [
                54, 53, 18, 17, 41, 11, 54, 31, 15, 29, 1, 26, 57, 51, 57, 18, 17, 42, 27, 56, 15, 4
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
            console.log(groups)
            // console.log(groups)
            expect(groups.length).toBe(5)
            const findItemArray = lift(findItemByNum)

            function candidates(item: TestInterface): TestInterface[] {
                return concat(findItemArray(item.connected), gatesByCenter[`${item.center}`])
            }

            const solution = findPath(uf, candidates, findItemByNum(42), findItemByNum(56))
            console.log(solution)
        })
    })
})

export enum Center {
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

const findItemByNum = (itemNum: number) => allItems.find(({ num }) => num === itemNum) ?? allItems[0]

const allItems: TestInterface[] = [
    {
        num: 41,
        center: Center.Root,
        connected: [30]
    },
    {
        num: 19,
        center: Center.Root,
        connected: [49]
    },
    {
        num: 13,
        center: Center.Identity,
        connected: [33]
    },
    {
        num: 49,
        center: Center.ESP,
        connected: [19]
    },
    {
        num: 30,
        center: Center.ESP,
        connected: [41]
    },
    {
        num: 55,
        center: Center.ESP,
        connected: [39]
    },
    {
        num: 37,
        center: Center.ESP,
        connected: [40]
    },
    {
        num: 63,
        center: Center.Head,
        connected: [4]
    },
    {
        num: 22,
        center: Center.ESP,
        connected: [12]
    },
    {
        num: 36,
        center: Center.ESP,
        connected: [35]
    },
    {
        num: 25,
        center: Center.Identity,
        connected: [51]
    },
    {
        num: 17,
        center: Center.Ajna,
        connected: [62]
    },
    {
        num: 21,
        center: Center.Will,
        connected: [45]
    },
    {
        num: 51,
        center: Center.Will,
        connected: [26]
    },
    {
        num: 42,
        center: Center.Sacral,
        connected: [53]
    },
    {
        num: 3,
        center: Center.Sacral,
        connected: [60]
    },
    {
        num: 27,
        center: Center.Sacral,
        connected: [50]
    },
    {
        num: 24,
        center: Center.Ajna,
        connected: [61]
    },
    {
        num: 2,
        center: Center.Identity,
        connected: [14]
    },
    {
        num: 23,
        center: Center.Throat,
        connected: [43]
    },
    {
        num: 8,
        center: Center.Throat,
        connected: [1]
    },
    {
        num: 20,
        center: Center.Throat,
        connected: [10, 57, 34]
    },
    {
        num: 16,
        center: Center.Throat,
        connected: [48]
    },
    {
        num: 35,
        center: Center.Throat,
        connected: [36]
    },
    {
        num: 45,
        center: Center.Throat,
        connected: [21]
    },
    {
        num: 12,
        center: Center.Throat,
        connected: [22]
    },
    {
        num: 15,
        center: Center.Identity,
        connected: [5]
    },
    {
        num: 52,
        center: Center.Root,
        connected: [9]
    },
    {
        num: 39,
        center: Center.Root,
        connected: [55]
    },
    {
        num: 53,
        center: Center.Root,
        connected: [42]
    },
    {
        num: 62,
        center: Center.Throat,
        connected: [17]
    },
    {
        num: 56,
        center: Center.Throat,
        connected: [11]
    },
    {
        num: 31,
        center: Center.Throat,
        connected: [7]
    },
    {
        num: 33,
        center: Center.Throat,
        connected: [13]
    },
    {
        num: 7,
        center: Center.Identity,
        connected: [31]
    },
    {
        num: 4,
        center: Center.Ajna,
        connected: [63]
    },
    {
        num: 29,
        center: Center.Sacral,
        connected: [46]
    },
    {
        num: 59,
        center: Center.Sacral,
        connected: [6]
    },
    {
        num: 40,
        center: Center.Will,
        connected: [37]
    },
    {
        num: 64,
        center: Center.Head,
        connected: [47]
    },
    {
        num: 47,
        center: Center.Ajna,
        connected: [64]
    },
    {
        num: 6,
        center: Center.ESP,
        connected: [59]
    },
    {
        num: 46,
        center: Center.Identity,
        connected: [29]
    },
    {
        num: 18,
        center: Center.Spleen,
        connected: [58]
    },
    {
        num: 48,
        center: Center.Spleen,
        connected: [16]
    },
    {
        num: 57,
        center: Center.Spleen,
        connected: [34, 10, 20]
    },
    {
        num: 32,
        center: Center.Spleen,
        connected: [54]
    },
    {
        num: 50,
        center: Center.Spleen,
        connected: [27]
    },
    {
        num: 28,
        center: Center.Spleen,
        connected: [36]
    },
    {
        num: 44,
        center: Center.Spleen,
        connected: [26]
    },
    {
        num: 1,
        center: Center.Identity,
        connected: [8]
    },
    {
        num: 43,
        center: Center.Ajna,
        connected: [23]
    },
    {
        num: 14,
        center: Center.Sacral,
        connected: [2]
    },
    {
        num: 34,
        center: Center.Sacral,
        connected: [57, 10, 20]
    },
    {
        num: 9,
        center: Center.Sacral,
        connected: [52]
    },
    {
        num: 5,
        center: Center.Sacral,
        connected: [15]
    },
    {
        num: 26,
        center: Center.Will,
        connected: [44]
    },
    {
        num: 11,
        center: Center.Ajna,
        connected: [56]
    },
    {
        num: 10,
        center: Center.Identity,
        connected: [20, 57, 34]
    },
    {
        num: 58,
        center: Center.Root,
        connected: [18]
    },
    {
        num: 38,
        center: Center.Root,
        connected: [28]
    },
    {
        num: 54,
        center: Center.Root,
        connected: [32]
    },
    {
        num: 61,
        center: Center.Head,
        connected: [24]
    },
    {
        num: 60,
        center: Center.Root,
        connected: [3]
    }
]
