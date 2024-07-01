import JSBI from 'jsbi'
import { bigIntBitLength, bigIntModPow, randomBigIntBits, twoMultiplicity } from '../bigint-utils.js'
import { ICryptoProvider } from './abstract.js'

export function millerRabin(crypto: ICryptoProvider, n: JSBI, rounds = 20): boolean {
    // small numbers: 0, 1 are not prime, 2, 3 are prime
    if (JSBI.lessThan(n, JSBI.BigInt(4))) return JSBI.greaterThan(n, JSBI.BigInt(1))
    if (JSBI.equal(JSBI.remainder(n, JSBI.BigInt(2)), JSBI.BigInt(0)) || JSBI.lessThan(n, JSBI.BigInt(0))) return false

    const nBits = bigIntBitLength(n)
    const nSub = JSBI.subtract(n, JSBI.BigInt(1))

    const r = twoMultiplicity(nSub)
    const d = JSBI.signedRightShift(nSub, r)

    for (let i = 0; i < rounds; i++) {
        let base: JSBI

        do {
            base = randomBigIntBits(crypto, nBits)
        } while (JSBI.lessThanOrEqual(base, JSBI.BigInt(1)) || JSBI.greaterThanOrEqual(base, nSub))

        let x = bigIntModPow(base, d, n)
        // if (x.eq(bigInt.one) || x.eq(nSub)) continue
        if (JSBI.equal(x, JSBI.BigInt(1)) || JSBI.equal(x, nSub)) continue

        let i = JSBI.BigInt(0)
        let y: JSBI

        while (JSBI.lessThan(i, r)) {
            // y = x.modPow(bigInt[2], n)
            y = bigIntModPow(x, JSBI.BigInt(2), n)

            if (JSBI.equal(x, JSBI.BigInt(1))) return false
            if (JSBI.equal(x, nSub)) break
            i = JSBI.add(i, JSBI.BigInt(1))

            x = y
        }

        if (JSBI.equal(i, r)) return false
    }

    return true
}
