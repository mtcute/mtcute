import JSBI from 'jsbi'
import {
    bigIntAbs,
    bigIntGcd,
    bigIntMin,
    bigIntToBuffer,
    bufferToBigInt,
    randomBigIntInRange,
} from '../bigint-utils.js'
import { ICryptoProvider } from './abstract.js'

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
    if (JSBI.equal(JSBI.remainder(n, JSBI.BigInt(2)), JSBI.BigInt(0))) return JSBI.BigInt(2)

    let y = randomBigIntInRange(crypto, JSBI.subtract(n, JSBI.BigInt(1)))
    const c = randomBigIntInRange(crypto, JSBI.subtract(n, JSBI.BigInt(1)))
    const m = randomBigIntInRange(crypto, JSBI.subtract(n, JSBI.BigInt(1)))
    let g = JSBI.BigInt(1)
    let r = JSBI.BigInt(1)
    let q = JSBI.BigInt(1)

    let ys: JSBI
    let x: JSBI

    while (JSBI.equal(g, JSBI.BigInt(1))) {
        x = y
        for (let i = JSBI.BigInt(0); JSBI.greaterThanOrEqual(r, i); i = JSBI.add(i, JSBI.BigInt(1)))
            y = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(y, y), n), c), n)

        let k = JSBI.BigInt(0)

        while (JSBI.lessThan(k, r) && JSBI.equal(g, JSBI.BigInt(1))) {
            ys = y

            for (
                let i = JSBI.BigInt(0);
                JSBI.lessThan(i, bigIntMin(m, JSBI.subtract(r, k)));
                i = JSBI.add(i, JSBI.BigInt(1))
            ) {
                y = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(y, y), n), c), n)
                q = JSBI.remainder(JSBI.multiply(q, bigIntAbs(JSBI.subtract(x, y))), n)
            }

            g = bigIntGcd(q, n)
            k = JSBI.add(k, m)
        }

        r = JSBI.leftShift(r, JSBI.BigInt(1))
    }

    if (g === n) {
        do {
            ys = JSBI.remainder(JSBI.add(JSBI.remainder(JSBI.multiply(ys!, ys!), n), c), n)

            g = bigIntGcd(JSBI.subtract(x!, ys!), n)
        } while (JSBI.lessThanOrEqual(g, JSBI.BigInt(1)))
    }

    return g
}
