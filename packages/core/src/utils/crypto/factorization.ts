import JSBI from 'jsbi'

import {
    ONE,
    TWO,
    ZERO,
    bigIntAbs,
    bigIntGcd,
    bigIntMin,
    bigIntToBuffer,
    bufferToBigInt,
    randomBigIntInRange,
} from '../bigint-utils.js'

import type { ICryptoProvider } from './abstract.js'

/**
 * Factorize `p*q` to `p` and `q` synchronously using Brent-Pollard rho algorithm
 * @param pq
 */
export function factorizePQSync(crypto: ICryptoProvider, pq: Uint8Array): [Uint8Array, Uint8Array] {
    const pq_ = bufferToBigInt(pq)

    const n = PollardRhoBrent(crypto, pq_)
    const m = JSBI.divide(pq_, n)

    let p
    let q

    if (JSBI.lessThan(n, m)) {
        p = n
        q = m
    } else {
        p = m
        q = n
    }

    return [bigIntToBuffer(p), bigIntToBuffer(q)]
}

function PollardRhoBrent(crypto: ICryptoProvider, n: JSBI): JSBI {
    if (JSBI.equal(JSBI.remainder(n, TWO), ZERO)) return TWO

    let y = randomBigIntInRange(crypto, JSBI.subtract(n, ONE))
    const c = randomBigIntInRange(crypto, JSBI.subtract(n, ONE))
    const m = randomBigIntInRange(crypto, JSBI.subtract(n, ONE))
    let g = ONE
    let r = ONE
    let q = ONE

    let ys: JSBI
    let x: JSBI

    while (JSBI.equal(g, ONE)) {
        x = y
        for (let i = 0; JSBI.GE(r, i); i++) y = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(y, y), n), c), n)

        let k = ZERO

        while (JSBI.lessThan(k, r) && JSBI.equal(g, ONE)) {
            ys = y

            for (let i = ZERO; JSBI.lessThan(i, bigIntMin(m, JSBI.subtract(r, k))); i = JSBI.add(i, ONE)) {
                y = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(y, y), n), c), n)
                q = JSBI.remainder(JSBI.multiply(q, bigIntAbs(JSBI.subtract(x, y))), n)
            }

            g = bigIntGcd(q, n)
            k = JSBI.add(k, m)
        }

        r = JSBI.leftShift(r, ONE)
    }

    if (JSBI.equal(g, n)) {
        do {
            ys = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(ys!, ys!), n), c), n)

            g = bigIntGcd(JSBI.subtract(x!, ys!), n)
        } while (JSBI.lessThanOrEqual(g, ONE))
    }

    return g
}
