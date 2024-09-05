import { describe, expect, it } from 'vitest'
import { defaultCryptoProvider } from '@mtcute/test'
import { bigint } from '@fuman/utils'

import { factorizePQSync } from './factorization.js'

describe('prime factorization', () => {
    const testFactorization = (pq: bigint, p: bigint, q: bigint) => {
        const [p_, q_] = factorizePQSync(defaultCryptoProvider, bigint.toBytes(pq))
        expect(bigint.fromBytes(p_)).toBe(p)
        expect(bigint.fromBytes(q_)).toBe(q)
    }

    it('should factorize', () => {
        testFactorization(2090522174869285481n, 1112973847n, 1878321023n)
        testFactorization(1470626929934143021n, 1206429347n, 1218991343n)
        testFactorization(2804275833720261793n, 1555252417n, 1803100129n)
    })
})
