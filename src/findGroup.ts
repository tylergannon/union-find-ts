import { Maybe, Just, Nothing } from 'purify-ts'
import { any, concat, prepend } from 'ramda'
import { find, findItem, hasGroup, linkItemAll, UnionFind } from './UnionFind'

interface GroupReducer<T> {
    readonly solutions: Maybe<T[][]>
    readonly uf: UnionFind<T>
    readonly seen: T[]
}

export const findPath = <T>(
    uf: UnionFind<T>,
    candidates: (item: T, uf: UnionFind<T>) => T[],
    src: T,
    dest: T
): Maybe<T[][]> => {
    const destGroup = findItem(uf, dest)
    const newUF: UnionFind<T> = {
        ...uf,
        ranks: uf.ranks.map((it, idx) => (find(uf, idx) === destGroup ? it : 0)),
        roots: uf.roots.map(it => (find(uf, it) === destGroup ? it : 0))
    }
    return _findPath(uf, newUF, candidates, src, dest, [])
}

const joinSolutions = <T>(left: T[][], right: T[][]) => {
    const comp = left[0].length - right[0].length
    return comp === 0 ? concat(left, right) : comp < 0 ? left : right
}

function _findPath<T>(
    ufInitial: UnionFind<T>,
    uf: UnionFind<T>,
    candidates: (item: T, uf: UnionFind<T>) => T[],
    item: T,
    group2: T,
    seen: T[]
): Maybe<T[][]> {
    const srcComponent = findItem(uf, item)
    const adjacent = candidates(item, uf).filter(it => findItem(uf, it) !== srcComponent)
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
                solutions: _findPath(ufInitial, accUf, candidates, candidate, group2, innerSeen)
                    .map(it =>
                        hasGroup(ufInitial, candidate) ? it : it.map(path => prepend(candidate, path))
                    )
                    .reduce(
                        (previous, currentValue) => Just(previous.reduce(joinSolutions, currentValue)),
                        solutions
                    )
            }
        },
        { uf: linkItemAll(uf, item, adjacent), solutions: Nothing, seen } as GroupReducer<T>
    ).solutions
}
