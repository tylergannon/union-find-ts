import { unionFind } from '../src'
import type { UnionFind } from '../src'

describe('Union-Find', () => {
    describe('Building object', () => {
        it('It should be able to build an object', () => {
            const sorkin = unionFind(20, x => x)
            expect(sorkin.items).toHaveLength(21)
            expect(sorkin.ranks).toHaveLength(21)
            expect(sorkin.roots).toHaveLength(21)
        })

        // it('Should ', () => {})
    })
})
