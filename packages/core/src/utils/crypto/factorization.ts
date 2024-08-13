import {
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
    const m = pq_ / n

    let p
    let q

    if (n < m) {
        p = n
        q = m
    } else {
        p = m
        q = n
    }

    return [bigIntToBuffer(p), bigIntToBuffer(q)]
}

function PollardRhoBrent(crypto: ICryptoProvider, n: bigint): bigint {
    if (n % 2n === 0n) return 2n

    let y = randomBigIntInRange(crypto, n - 1n)
    const c = randomBigIntInRange(crypto, n - 1n)
    const m = randomBigIntInRange(crypto, n - 1n)
    let g = 1n
    let r = 1n
    let q = 1n

    let ys: bigint
    let x: bigint

    while (g === 1n) {
        x = y
        for (let i = 0; r >= i; i++) y = (((y * y) % n) + c) % n

        let k = 0n

        while (k < r && g === 1n) {
            ys = y

            for (let i = 0n; i < bigIntMin(m, r - k); i++) {
                y = (((y * y) % n) + c) % n
                q = (q * bigIntAbs(x - y)) % n
            }

            g = bigIntGcd(q, n)
            k = k + m
        }

        r <<= 1n
    }

    if (g === n) {
        do {
            ys = (((ys! * ys!) % n) + c) % n

            g = bigIntGcd(x! - ys!, n)
        } while (g <= 1n)
    }

    return g
}
