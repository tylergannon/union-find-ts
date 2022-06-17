import { repeat, tail, prepend, groupBy, values, clone } from 'ramda'

/**
 * A Union-Find data structure.
 */
export interface UnionFind<T> {
    readonly items: T[]
    readonly roots: number[]
    readonly ranks: number[]
    readonly map: (val: T) => number
}
const lenGtOne = (x: ArrayLike<any>) => x.length > 1
/**
 * Group the items in a UF structure according to the components built using `link()`.
 * @param uf The UnionFind to group
 * @returns A list of lists, each one of which is a component in [uf].
 */
export const toGroups = <T>(uf: UnionFind<T>) =>
    values(groupBy(item => `${find(uf, uf.map(item))}`, tail(uf.items)))

/**
 *
 * @param uf A component map
 * @returns The groups that are greater than size one.
 */
export const toConnectedGroups = <T>(uf: UnionFind<T>) => toGroups(uf).filter(lenGtOne)

type HasGroup = {
    /**
     *
     * @param uf A Component Map
     * @param num Item number in the component
     * @returns true if the roots object has a nonzero value for this item.
     */
    <T>(uf: UnionFind<T>, num: number): boolean
    /**
     *
     * @param uf A Component Map
     * @param item Item from the mapped collection
     * @returns true if the roots object has a nonzero value for this item.
     */
    <T>(uf: UnionFind<T>, item: T): boolean
}

/**
 * Determines whether the item has been grouped yet (might be itself)
 * @param uf A Component Map
 * @param num Item number in the component
 * @returns true if the roots object has a nonzero value for this item.
 */
export const hasGroup: HasGroup = <T>(uf: UnionFind<T>, num: number | T): boolean =>
    uf.roots[typeof num === 'number' ? num : uf.map(num)] !== 0

/**
 * Build an array of size [topNumber + 1] filled with numbers ascending 0 to topNumber.
 * @param topNumber The last index of the array to create.
 * @returns An array of size [topNumber + 1] filled with numbers ascending 0 to topNumber.
 */
const sequenceArray = (topNumber: number) => [...Array(topNumber + 1).keys()]

/**
 * Build an array of length [topIndex + 1], full of zeroes.
 * @param topIndex the last index of the array.  Created array will have length == [topIndex + 1]
 * @returns An array of length [topIndex + 1], full of zeroes.
 */
const zeroesArray = (topIndex: number) => repeat(0, topIndex + 1)
type Linker<V> = { (args: { idx: number; item: V }): number[] }
/**
 * Create a UnionFind structure for the given items.
 * Optional linker and linkItem functions can allow the components to be fully resolved during object construction.
 * @param size the number of items in the graph
 * @param map Key function mapping item to a unique key
 * @param linker optional function that identifies a list of item keys that should be linked to the item number.
 */
export function unionFind(size: number, map: (val: number) => number, links: number[][]): UnionFind<number>
/**
 * Create a UnionFind structure for the given items.
 * Optional linker and linkItem functions can allow the components to be fully resolved during object construction.
 * @param items The list of items in the forest
 * @param map Key function mapping item to a unique key
 * @param linker optional function that identifies a list of item keys that should be linked to the item number.
 */
export function unionFind<T>(items: T[], map: (val: T) => number, links: number[][]): UnionFind<T>
/**
 * Create a UnionFind structure for the given items.
 * Optional linker and linkItem functions can allow the components to be fully resolved during object construction.
 * @param items The list of items in the forest
 * @param map Key function mapping item to a unique key
 * @param linker optional function that identifies a list of item keys that should be linked to the item number.
 */
export function unionFind<T>(items: T[], map: (val: T) => number, linker?: Linker<T>): UnionFind<T>
/**
 * Create a UnionFind structure of the given size.  The [items] attribute will be initialized to a list of numbers from one to size + 1.
 * Optional linker and linkItem functions can allow the components to be fully resolved during object construction.
 * @param size Number of items in the UnionFind
 * @param map Map function that maps a number to its name.  use (x)=>x as a reasonable default.
 * @param linker optional function that identifies a list of item keys that should be linked to the item number.
 */
export function unionFind(
    size: number,
    map: (val: number) => number,
    linker?: Linker<number>
): UnionFind<number>
export function unionFind<T = unknown, U extends T[] | number = number, V = U extends number ? number : T>(
    itemsOrSize: U,
    map: (val: V) => number,
    linker?: Linker<V> | number[][]
): UnionFind<V> {
    const items: V[] = (
        typeof itemsOrSize === 'number'
            ? sequenceArray(itemsOrSize)
            : prepend(null as V, itemsOrSize as unknown as V[])
    ) as V[]

    const uf1: UnionFind<V> = {
        items,
        map,
        ranks: zeroesArray(items.length - 1),
        roots: zeroesArray(items.length - 1)
    }

    return linker
        ? flatten(
              typeof linker === 'function'
                  ? tail(items).reduce((uf, item, index) => {
                        return linkAll(uf, map(item), linker({ item, idx: index + 1 }))
                    }, uf1)
                  : linker.reduce((uf, [left, right]) => link(uf, left, right), uf1)
          )
        : uf1
}

/**
 * Copy the given list, putting [val] at index [idx] in replacement of whatever was there.
 * @param list
 * @param idx
 * @param val
 * @returns
 */
const replaceAt = <T>(list: T[], idx: number, val: T) => [...list.slice(0, idx), val, ...list.slice(idx + 1)]

type Finder = {
    /**
     * Find the group number of the item number given in @item.
     * The item number can be obtained by calling UnionFind::map.
     * @param uf a component map
     * @param item the ordinal of the item
     * @returns The component number of the item, or the component number if not defined.
     */
    <T>(uf: UnionFind<T>, item: number): number
    /**
     * @param ufLike an object containing the roots of a UnionFind.
     * @param item the ordinal number of the item within @ufLike.
     * @returns The component number of the item, or the component number if not defined.
     */
    <T extends { roots: number[] }>(ufLike: T, item: number): number
}

/**
 * Gives the item a group number equal to itself, in the event that it
 * is undefined (has not been linked.)
 * @param roots roots object from a UnionFind
 * @param item item ordinal
 * @returns The value at roots[item] or else [item], if roots[item] is zero
 */
const rootOf = (roots: number[], item: number) => (roots[item] === 0 ? item : roots[item])

/**
 * Find group of item in the given UnionFind.
 * @param param0 UnionFind object
 * @param item Item to find group.
 * @returns Group number of [item]
 */
export const find: Finder = <T extends { roots: number[] }>({ roots }: T, item: number): number =>
    rootOf(roots, item) === item ? item : find({ roots }, rootOf(roots, item))

export const findItem = <T>(uf: UnionFind<T>, item: T) => find(uf, uf.map(item))

/**
 * Remap the component names in the UnionFind, so that each item directly
 * references its component.
 * @param uf
 * @returns an equivalent UnionFind with its paths shortened.
 */
const flatten: <T>(uf: UnionFind<T>) => UnionFind<T> = <T>(
    uf: UnionFind<T>,
    { roots }: UnionFind<T> = uf
) => ({ ...uf, roots: roots.map(it => find(uf, it)) })

/**
 * When linkAll is called with an empty array, we simply define the
 * one item in order to mark it later.
 * @param uf
 * @param item
 * @returns
 */
function defineOne<T>(uf: UnionFind<T>, item: number): UnionFind<T> {
    return {
        ...uf,
        ranks: replaceAt(uf.ranks, item, item)
    }
}

/**
 * Update the roots for the root of the item in question,
 * as well as for the items.
 *
 * Change the rank for the groups, as well.
 * @param uf
 * @param left
 * @param right
 */
export function link<T>(uf: UnionFind<T>, left: number, right: number): UnionFind<T>
export function link<T>(
    uf: UnionFind<T>,
    left: number,
    right: number,
    leftComponent: number = find(uf, left),
    rightComponent: number = find(uf, right),
    { roots, ranks }: UnionFind<T> = uf
): UnionFind<T> {
    if (leftComponent === rightComponent) {
        return uf
    }
    const newRoots = clone(roots)
    const newRanks = clone(ranks)
    // you want to set both components to the lower ranked of the two.  If equal we will choose the right.
    const rankComparison = ranks[leftComponent] - ranks[rightComponent]
    const newParent = rankComparison < 0 ? leftComponent : rightComponent

    const setParent = (idx: number) => {
        newRoots[idx] = newParent
    }

    ;[left, right, leftComponent, rightComponent].forEach(setParent)

    if (rankComparison === 0) {
        newRanks[newParent]++
    }

    return {
        ...uf,
        roots: newRoots,
        ranks: newRanks
    }
}

export const linkItem = <T>(uf: UnionFind<T>, left: T, right: T) => link(uf, uf.map(left), uf.map(right))

export const linkItemAll = <T>(uf: UnionFind<T>, left: T, right: T[]) => {
    return linkAll(uf, uf.map(left), right.map(uf.map))
}

export const linkAll = <T>(uf: UnionFind<T>, left: number, right: number[]) => {
    return right.length === 0
        ? defineOne(uf, left)
        : right.reduce((uf1, right1) => link(uf1, left, right1), uf)
}
