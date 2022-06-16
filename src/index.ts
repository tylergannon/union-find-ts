import { repeat, tail, prepend, groupBy, values, concat } from 'ramda'

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

/**
 * Assumes that both arguments each contain lists of the same length.
 * For example, one may have items of length 3 while the other has items of length 1.
 *
 * Returns the list containing shorter items.  If they have the same length, concatenates
 * the lists.
 * @param left One list of lists
 * @param right Another lists of lists
 * @returns The list containing shorter lists, or else the two concatenated.
 */
const shortestLengthLists = <T>(left: T[][], right: T[][]) => {
    if (left.length === 0) {
        return right
    }
    if (right.length === 0) {
        return left
    }
    if (left[0].length === right[0].length) {
        return concat(left, right)
    }
    if (right[0].length < left[0].length) {
        return right
    }
    return left
}

export const connectGroups = <T>(
    uf: UnionFind<T>,
    candidates: (item: T) => T[],
    group1: T[],
    group2: T[]
): T[][] => {
    return group1
        .map(g1 => _connectGroups(uf, candidates, g1, group2[0], [], group1))
        .reduce(shortestLengthLists)
}

/**
 *
 * @param uf
 * @param candidates Candidates function
 * @param param2
 * @param group2
 * @param path
 * @param seen
 * @returns
 */
const _connectGroups = <T>(
    uf: UnionFind<T>,
    candidates: (item: T) => T[],
    item: T,
    group2: T,
    path: T[],
    seen: T[]
): T[][] => {
    if (item in seen) {
        return []
    }
    if (findItem(uf, item) == findItem(uf, group2)) {
        return [path]
    }
    const newPath = uf.ranks[uf.map(item)] === 0 ? [item, ...path] : path
    const connected = candidates(item).filter(it => !(it in seen))
    const newSeen = concat(seen, connected)
    return connected
        .map(next => _connectGroups(linkItem(uf, next, item), candidates, next, group2, newPath, newSeen))
        .reduce(shortestLengthLists)
}

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

/**
 * Create a UnionFind structure for the given items.
 * Optional linker and linkItem functions can allow the components to be fully resolved during object construction.
 * @param items The list of items in the forest
 * @param map Key function mapping item to a unique key
 * @param linker optional function that identifies a list of item keys that should be linked to the item number.
 */
export function unionFind<T>(
    items: T[],
    map: (val: T) => number,
    linker?: (args: { idx: number; item: T }) => number[]
): UnionFind<T>
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
    linker?: (args: { idx: number; item: number }) => number[]
): UnionFind<number>
export function unionFind<T = unknown, U extends T[] | number = number, V = U extends number ? number : T>(
    itemsOrSize: U,
    map: (val: V) => number,
    linker?: (args: { idx: number; item: V }) => number[]
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
              tail(items).reduce((uf, item, index) => {
                  return linkAll(uf, map(item), linker({ item, idx: index + 1 }))
              }, uf1)
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
const replaceTwo = <T>(list: T[], idx1: number, idx2: number, val: T): T[] =>
    idx1 === idx2
        ? replaceAt(list, idx1, val)
        : idx1 > idx2
        ? replaceTwo(list, idx2, idx1, val)
        : [...list.slice(0, idx1), val, ...list.slice(idx1 + 1, idx2), val, ...list.slice(idx2 + 1)]

/**
 * Utility function to increment the value at index [idx], within a list of numbers (without mutating the list).
 * @param list
 * @param idx The index at which to increment
 * @returns A copy of [list] with the value at [idx] incremented by one.
 */
const incrementAt = (list: number[], idx: number) => replaceAt(list, idx, list[idx] + 1)

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
 *
 * @param uf
 * @param left
 * @param right
 */
export function link<T>(uf: UnionFind<T>, left: number, right: number): UnionFind<T>
export function link<T>(
    uf: UnionFind<T>,
    left: number,
    right: number,
    gl: number = find(uf, left),
    gr: number = find(uf, right),
    { roots, ranks }: UnionFind<T> = uf
): UnionFind<T> {
    if (gl === gr) {
        return uf
    }
    return {
        ...uf,
        roots: ranks[gl] < ranks[gr] ? replaceTwo(roots, gr, gl, gl) : replaceTwo(roots, gr, gl, gr),
        ranks: ranks[gl] === ranks[gr] ? incrementAt(ranks, gr) : ranks
    }
}

export const linkItem = <T>(uf: UnionFind<T>, left: T, right: T) => link(uf, uf.map(left), uf.map(right))

export const linkItemAll = <T>(uf: UnionFind<T>, left: T, right: T[]) =>
    linkAll(
        uf,
        uf.map(left),
        right.map(it => uf.map(it))
    )

export const linkAll = <T>(uf: UnionFind<T>, left: number, right: number[]) =>
    right.length === 0 ? defineOne(uf, left) : right.reduce((uf1, right1) => link(uf1, left, right1), uf)
