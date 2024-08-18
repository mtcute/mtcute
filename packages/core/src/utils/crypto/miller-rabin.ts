import { bigIntBitLength, bigIntModPow, randomBigIntBits, twoMultiplicity } from '../bigint-utils.js'

import type { ICryptoProvider } from './abstract.js'

export function millerRabin(crypto: ICryptoProvider, n: bigint, rounds = 20): boolean {
    // small numbers: 0, 1 are not prime, 2, 3 are prime
    if (n < 4n) return n > 1n
    if (n % 2n === 0n || n < 0n) return false

    const nBits = bigIntBitLength(n)
    const nSub = n - 1n

    const r = twoMultiplicity(nSub)
    const d = nSub >> r

    for (let i = 0; i < rounds; i++) {
        let base

        do {
            base = randomBigIntBits(crypto, nBits)
        } while (base <= 1n || base >= nSub)

        let x = bigIntModPow(base, d, n)
        // if (x.eq(bigInt.one) || x.eq(nSub)) continue
        if (x === 1n || x === nSub) continue

        let i = 0n
        let y: bigint

        while (i < r) {
            // y = x.modPow(bigInt[2], n)
            y = bigIntModPow(x, 2n, n)

            if (x === 1n) return false
            if (x === nSub) break
            i += 1n

            x = y
        }

        if (i === r) return false
    }

    return true
}
