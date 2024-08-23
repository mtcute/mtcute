import JSBI from 'jsbi'

import { ONE, TWO, ZERO, bigIntBitLength, bigIntModPow, randomBigIntBits, twoMultiplicity } from '../bigint-utils.js'

import type { ICryptoProvider } from './abstract.js'

const FOUR = JSBI.BigInt(4)

export function millerRabin(crypto: ICryptoProvider, n: JSBI, rounds = 20): boolean {
    // small numbers: 0, 1 are not prime, 2, 3 are prime
    if (JSBI.lessThan(n, FOUR)) return JSBI.greaterThan(n, ONE)
    if (JSBI.equal(JSBI.remainder(n, TWO), ZERO) || JSBI.lessThan(n, ZERO)) return false

    const nBits = bigIntBitLength(n)
    const nSub = JSBI.subtract(n, ONE)

    const r = twoMultiplicity(nSub)
    const d = JSBI.signedRightShift(nSub, r)

    for (let i = 0; i < rounds; i++) {
        let base

        do {
            base = randomBigIntBits(crypto, nBits)
        } while (JSBI.lessThanOrEqual(base, ONE) || JSBI.greaterThanOrEqual(base, nSub))

        let x = bigIntModPow(base, d, n)
        // if (x.eq(bigInt.one) || x.eq(nSub)) continue
        if (JSBI.equal(x, ONE) || JSBI.equal(x, nSub)) continue

        let i = ZERO
        let y: JSBI

        while (JSBI.lessThan(i, r)) {
            // y = x.modPow(bigInt[2], n)
            y = bigIntModPow(x, TWO, n)

            if (JSBI.equal(x, ONE)) return false
            if (JSBI.equal(x, nSub)) break
            i = JSBI.add(i, ONE)

            x = y
        }

        if (JSBI.equal(i, r)) return false
    }

    return true
}
