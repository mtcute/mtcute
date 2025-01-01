import type { ICryptoProvider } from './abstract.js'

import { BigInteger } from '@modern-dev/jsbn'
import { fromBytes, fromInt, geq, leq, lt, min2, randomBigIntInRange, toBytes } from '../bigint-utils.js'

const TWO = fromInt(2)

/**
 * Factorize `p*q` to `p` and `q` synchronously using Brent-Pollard rho algorithm
 * @param pq
 */
export function factorizePQSync(crypto: ICryptoProvider, pq: Uint8Array): [Uint8Array, Uint8Array] {
    const pq_ = fromBytes(pq)

    const n = PollardRhoBrent(crypto, pq_)
    const m = pq_.divide(n)

    let p
    let q

    if (lt(n, m)) {
        p = n
        q = m
    } else {
        p = m
        q = n
    }

    return [toBytes(p), toBytes(q)]
}

function PollardRhoBrent(crypto: ICryptoProvider, n: BigInteger): BigInteger {
    if (n.isEven()) return TWO

    const nSub1 = n.subtract(BigInteger.ONE)

    let y = randomBigIntInRange(crypto, nSub1)
    const c = randomBigIntInRange(crypto, nSub1)
    const m = randomBigIntInRange(crypto, nSub1)
    let g = fromInt(1)
    let r = fromInt(1)
    let q = fromInt(1)

    let ys: BigInteger
    let x: BigInteger

    while (g.equals(BigInteger.ONE)) {
        x = y
        for (let i = 0; geq(r, fromInt(i)); i++) y = y.multiply(y).mod(n).add(c).mod(n)
        // y = ((y * y) % n + c) % n

        let k = fromInt(0)

        while (lt(k, r) && g.equals(BigInteger.ONE)) {
            ys = y

            for (let i = fromInt(0); lt(i, min2(m, r.subtract(k))); i = i.add(BigInteger.ONE)) {
                y = y.multiply(y).mod(n).add(c).mod(n)
                q = q.multiply(x.subtract(y).abs()).mod(n)
                // y = (y * y % n + c) % n
                // q = q * abs(x - y) % n
            }

            g = q.GCD(n)
            k = k.add(m)
        }

        r = r.shiftLeft(1)
    }

    if (g.equals(n)) {
        do {
            ys = ys!.multiply(ys!).mod(n).add(c).mod(n)
            // ys = ((ys * ys) % n + c) % n

            g = x!.subtract(ys).GCD(n)
        } while (leq(g, BigInteger.ONE))
    }

    return g
}
