export { _randomBytes as randomBytes } from './platform/random.js'

/**
 * Check if two buffers are equal
 *
 * @param a  First buffer
 * @param b  Second buffer
 */
export function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

/**
 * Copy a buffer
 *
 * @param buf  Buffer to copy
 * @param start  Start offset
 * @param end  End offset
 */
export function cloneBuffer(buf: Uint8Array, start = 0, end = buf.length): Uint8Array {
    const ret = new Uint8Array(end - start)
    ret.set(buf.subarray(start, end))

    return ret
}

/**
 * Concatenate multiple buffers into one
 */
export function concatBuffers(buffers: Uint8Array[]): Uint8Array {
    /* eslint-disable no-restricted-globals */
    if (typeof Buffer !== 'undefined') {
        return Buffer.concat(buffers)
    }
    /* eslint-enable no-restricted-globals */

    let length = 0

    for (const buf of buffers) {
        length += buf.length
    }

    const ret = new Uint8Array(length)
    let offset = 0

    for (const buf of buffers) {
        ret.set(buf, offset)
        offset += buf.length
    }

    return ret
}

export function dataViewFromBuffer(buf: Uint8Array): DataView {
    return new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
}
