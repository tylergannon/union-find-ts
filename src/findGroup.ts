import { Maybe, Just, Nothing } from 'purify-ts'
import { any, concat, prepend } from 'ramda'
import { findItem, hasGroup, UnionFind } from './UnionFind'

interface GroupReducer<T> {
    readonly solutions: Maybe<T[][]>
    readonly uf: UnionFind<T>
    readonly seen: T[]
}

export const findPath = <T>(uf: UnionFind<T>, candidates: (item: T) => T[], src: T, dest: T): Maybe<T[][]> =>
    _findPath(uf, candidates, src, dest, [])

const joinSolutions = <T>(left: T[][], right: T[][]) => {
    const comp = left[0].length - right[0].length
    return comp === 0 ? concat(left, right) : comp < 0 ? left : right
}

/**
 * Okay let's try something different.
 * Enter the function.
 *
 * * Link the item to all viable neighbors that aren't seen. (Seen ones are already in the same component.)
 * *
 *
 *
 * @param uf
 * @param candidates Candidates function
 * @param item
 * @param group2
 * @param seen
 * @returns
 */
const _findPath = <T>(
    uf: UnionFind<T>,
    candidates: (item: T, uf: UnionFind<T>) => T[],
    item: T,
    group2: T,
    seen: T[]
): Maybe<T[][]> => {
    const adjacent = candidates(item, uf).filter(it => !seen.includes(it))
    const destGroup = findItem(uf, group2)

    if (any(it => findItem(uf, it) === destGroup, adjacent)) {
        return Just([[]])
    }

    // The trick is that in order to make links, I need to
    // also link to anything else on the

    return adjacent.reduce(
        ({ uf: accUf, solutions, seen: innerSeen }, candidate) => {
            innerSeen = prepend(candidate, innerSeen)
            return {
                seen: innerSeen,
                uf: accUf,
                solutions: _findPath(accUf, candidates, candidate, group2, innerSeen)
                    .map(it => (hasGroup(uf, candidate) ? it : it.map(path => prepend(candidate, path))))
                    .reduce(
                        (previous, currentValue) => Just(previous.reduce(joinSolutions, currentValue)),
                        solutions
                    )
            }
        },
        { uf, solutions: Nothing, seen } as GroupReducer<T>
    ).solutions
}
