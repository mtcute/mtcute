import bigInt, { BigInteger } from 'big-integer'

import { randomBigIntBits, twoMultiplicity } from '../bigint-utils'

export function millerRabin(n: BigInteger, rounds = 20): boolean {
    // small numbers: 0, 1 are not prime, 2, 3 are prime
    if (n.lt(bigInt[4])) return n.gt(bigInt[1])
    if (n.isEven() || n.isNegative()) return false

    const nBits = n.bitLength().toJSNumber()
    const nSub = n.minus(1)

    const r = twoMultiplicity(nSub)
    const d = nSub.shiftRight(r)

    for (let i = 0; i < rounds; i++) {
        let base

        do {
            base = randomBigIntBits(nBits)
        } while (base.leq(bigInt.one) || base.geq(nSub))

        let x = base.modPow(d, n)
        if (x.eq(bigInt.one) || x.eq(nSub)) continue

        let i = bigInt.zero
        let y: BigInteger

        while (i.lt(r)) {
            y = x.modPow(bigInt[2], n)

            if (x.eq(bigInt.one)) return false
            if (x.eq(nSub)) break
            i = i.plus(bigInt.one)

            x = y
        }

        if (i.eq(r)) return false
    }

    return true
}
