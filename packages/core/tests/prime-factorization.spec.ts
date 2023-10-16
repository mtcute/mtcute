import { expect } from 'chai'
import { describe, it } from 'mocha'

import { hexDecodeToBuffer, hexEncode } from '@mtcute/tl-runtime'

import { factorizePQSync } from '../src/utils/crypto/factorization.js'

describe('prime factorization', function () {
    this.timeout(10000) // since PQ factorization relies on RNG, it may take a while (or may not!)

    it('should decompose PQ to prime factors P and Q', () => {
        const testFactorization = (pq: string, p: string, q: string) => {
            const [p1, q1] = factorizePQSync(hexDecodeToBuffer(pq))
            expect(hexEncode(p1)).eq(p.toLowerCase())
            expect(hexEncode(q1)).eq(q.toLowerCase())
        }

        // from samples at https://core.telegram.org/mtproto/samples-auth_key
        testFactorization('17ED48941A08F981', '494C553B', '53911073')
        // random example
        testFactorization('14fcab4dfc861f45', '494c5c99', '494c778d')
    })
})
