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
    if (buffers.length === 1) return buffers[0]

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

/**
 * Shortcut for creating a DataView from a Uint8Array
 */
export function dataViewFromBuffer(buf: Uint8Array): DataView {
    return new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
}

/**
 * Reverse a buffer (or a part of it) into a new buffer
 */
export function bufferToReversed(buf: Uint8Array, start = 0, end = buf.length): Uint8Array {
    const len = end - start
    const ret = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
        ret[i] = buf[end - i - 1]
    }

    return ret
}
