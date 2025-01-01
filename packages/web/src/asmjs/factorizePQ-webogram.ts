/* eslint-disable no-console */
// this is based off of webogram's implementation of pqFactorization
// fallback to mtcute if something fails(just like webogram)
// i guess that should be a main occuring theme here? use leemon if something is terribly slow?
// really hope this only applies to KaiOS 2.5

import type { ICryptoProvider } from '../utils.js'

import {
    add_,
    bigInt2str,
    bpe,
    copy_,
    copyInt_,
    divide_,
    eGCD_,
    equalsInt,
    greater,
    isZero,
    one,
    rightShift_,
    str2bigInt,
    sub_,
    // @ts-expect-error: add leemon
} from 'leemon'
import { factorizePQSync, fromBytes } from '../utils.js'

const hexCharValueTable: Record<string, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
}

function hexDecodeInner(buf: Uint8Array, string: string): void {
    const strLen = string.length
    const length = Math.min(buf.length, strLen / 2)

    let i

    for (i = 0; i < length; ++i) {
        const a = hexCharValueTable[string[i * 2]]
        const b = hexCharValueTable[string[i * 2 + 1]]

        if (a === undefined || b === undefined) {
            return
        }
        buf[i] = (a << 4) | b
    }
}

export function hexDecode(string: string): Uint8Array {
    const buf = new Uint8Array(Math.ceil(string.length / 2))
    hexDecodeInner(buf, string)

    return buf
}

function bytesFromLeemonBigInt(bigInt: any) {
    const str = bigInt2str(bigInt, 16)

    return hexDecode(str)
}

function nextRandomInt(maxValue: number) {
    return Math.floor(Math.random() * maxValue)
}

function pqPrimeLeemon(what: any): [Uint8Array, Uint8Array] {
    const minBits = 64
    const minLen = Math.ceil(minBits / bpe) + 1

    let i, q
    let j, lim
    let P
    let Q
    const a = new Array(minLen)
    const b = new Array(minLen)
    const c = new Array(minLen)
    const g = new Array(minLen)
    const z = new Array(minLen)
    const x = new Array(minLen)
    const y = new Array(minLen)

    for (i = 0; i < 3; i++) {
        q = (nextRandomInt(128) & 15) + 17
        copyInt_(x, nextRandomInt(1000000000) + 1)
        copy_(y, x)
        lim = 1 << (i + 18)

        for (j = 1; j < lim; j++) {
            copy_(a, x)
            copy_(b, x)
            copyInt_(c, q)

            while (!isZero(b)) {
                if (b[0] & 1) {
                    add_(c, a)
                    if (greater(c, what)) {
                        sub_(c, what)
                    }
                }
                add_(a, a)
                if (greater(a, what)) {
                    sub_(a, what)
                }
                rightShift_(b, 1)
            }

            copy_(x, c)
            if (greater(x, y)) {
                copy_(z, x)
                sub_(z, y)
            } else {
                copy_(z, y)
                sub_(z, x)
            }
            eGCD_(z, what, g, a, b)
            if (!equalsInt(g, 1)) {
                break
            }
            if ((j & (j - 1)) === 0) {
                copy_(y, x)
            }
        }
        if (greater(g, one)) {
            break
        }
    }

    divide_(what, g, x, y)

    if (greater(g, x)) {
        P = x
        Q = g
    } else {
        P = g
        Q = x
    }

    // console.log(dT(), 'done', bigInt2str(what, 10), bigInt2str(P, 10), bigInt2str(Q, 10))

    return [bytesFromLeemonBigInt(P), bytesFromLeemonBigInt(Q)]
}

export function webogramFactorizePQSync(crypto: ICryptoProvider, pq: Uint8Array): [Uint8Array, Uint8Array] {
    const what = fromBytes(pq)

    try {
        console.time('leemon pq')
        const result = pqPrimeLeemon(str2bigInt(what.toString(16), 16, Math.ceil(64 / bpe) + 1))
        console.timeEnd('leemon pq')
        return result
    } catch (e) {
        console.error('Leemon pq failed', e)
    }

    return factorizePQSync(crypto, pq)
}
