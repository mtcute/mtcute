import bigInt, { BigInteger } from 'big-integer'

import {
    bigIntToBuffer,
    bufferToBigInt,
    randomBigIntInRange,
} from '../bigint-utils'

/**
 * Factorize `p*q` to `p` and `q` synchronously using Brent-Pollard rho algorithm
 * @param pq
 */
export function factorizePQSync(pq: Buffer): [Buffer, Buffer] {
    const pq_ = bufferToBigInt(pq)

    const n = PollardRhoBrent(pq_)
    const m = pq_.divide(n)

    let p; let q

    if (n.lt(m)) {
        p = n
        q = m
    } else {
        p = m
        q = n
    }

    return [bigIntToBuffer(p), bigIntToBuffer(q)]
}

function PollardRhoBrent(n: BigInteger): BigInteger {
    if (n.isEven()) return bigInt[2]

    let y = randomBigIntInRange(n.minus(1))
    const c = randomBigIntInRange(n.minus(1))
    const m = randomBigIntInRange(n.minus(1))
    let g = bigInt.one
    let r = bigInt.one
    let q = bigInt.one

    let ys: BigInteger
    let x: BigInteger

    while (g.eq(bigInt.one)) {
        x = y
        for (let i = 0; r.geq(i); i++) y = y.multiply(y).mod(n).plus(c).mod(n)
        // y = ((y * y) % n + c) % n

        let k = bigInt.zero

        while (k.lt(r) && g.eq(1)) {
            ys = y

            for (
                let i = bigInt.zero;
                i.lt(bigInt.min(m, r.minus(k)));
                i = i.plus(bigInt.one)
            ) {
                y = y.multiply(y).mod(n).plus(c).mod(n)
                q = q.multiply(x.minus(y).abs()).mod(n)
                // y = (y * y % n + c) % n
                // q = q * abs(x - y) % n
            }

            g = bigInt.gcd(q, n)
            k = k.plus(m)
        }

        r = r.multiply(bigInt[2])
    }

    if (g.eq(n)) {
        do {
            ys = ys!.multiply(ys!).mod(n).plus(c).mod(n)
            // ys = ((ys * ys) % n + c) % n

            g = bigInt.gcd(x!.minus(ys), n)
        } while (g.leq(bigInt.one))
    }

    return g
}
