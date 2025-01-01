import type { ICryptoProvider } from './abstract.js'

import { BigInteger } from '@modern-dev/jsbn'
import { bitLength, fromInt, geq, gt, leq, lt, randomBigIntBits, twoMultiplicity } from '../bigint-utils.js'

const TWO = fromInt(2)

export function millerRabin(crypto: ICryptoProvider, n: BigInteger, rounds = 20): boolean {
    // small numbers: 0, 1 are not prime, 2, 3 are prime
    if (lt(n, fromInt(4))) return gt(n, BigInteger.ONE)
    if (n.isEven() || lt(n, BigInteger.ZERO)) return false

    const nBits = bitLength(n)
    const nSub = n.subtract(BigInteger.ONE)

    const r = twoMultiplicity(nSub)
    const d = nSub.shiftRight(r.intValue())

    for (let i = 0; i < rounds; i++) {
        let base

        do {
            base = randomBigIntBits(crypto, nBits)
        } while (leq(base, BigInteger.ONE) || geq(base, nSub))

        let x = base.modPow(d, n)
        if (x.equals(BigInteger.ONE) || x.equals(nSub)) continue

        // we mutate, therefore we cannot use static values
        const i = fromInt(0)
        let y: BigInteger

        while (lt(i, r)) {
            y = x.modPow(TWO, n)

            if (x.equals(BigInteger.ONE)) return false
            if (x.equals(nSub)) break
            // i = i + ONE
            i.addTo(BigInteger.ONE, i)

            x = y
        }

        if (i.equals(r)) return false
    }

    return true
}
