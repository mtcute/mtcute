import { getRandomInt } from '../misc-utils'

const {
    eGCD_,
    greater,
    divide_,
    str2bigInt,
    equalsInt,
    isZero,
    bigInt2str,
    copy_,
    copyInt_,
    rightShift_,
    sub_,
    add_,
    one,
    bpe,
} = require('leemon')

type leemonBigint = number[]

function leemonBigintToBytes(val: leemonBigint): Buffer {
    return Buffer.from(bigInt2str(val, 16), 'hex')
}

export function factorizePQSync(pq: Buffer): [Buffer, Buffer] {
    return leemonPqFactorizationSync(
        str2bigInt(pq.toString('hex'), 16, Math.ceil(64 / bpe) + 1)
    )
}

// TODO: maybe move this to CryptoProvider to allow delegating computations to a worker?
// returns tuple of [P, Q]
function leemonPqFactorizationSync(what: leemonBigint): [Buffer, Buffer] {
    // i honestly have no idea where this code originates and how it works,
    // but this is some ancient magic kind of stuff.
    // i'm guessing it's from webogram (https://github.com/zhukov/webogram/blob/master/app/js/lib/bin_utils.js)
    // but i'm not sure if this is its real origin
    const minBits = 64
    const minLen = Math.ceil(minBits / bpe) + 1
    let it = 0
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
        q = (getRandomInt(128) & 15) + 17
        copyInt_(x, getRandomInt(1000000000) + 1)
        copy_(y, x)
        lim = 1 << (i + 18)

        for (j = 1; j < lim; j++) {
            ++it
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
            if ((j & (j - 1)) == 0) {
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

    return [leemonBigintToBytes(P), leemonBigintToBytes(Q)]
}
