export { _randomBytes as randomBytes } from './platform/crypto'

const b64urlAvailable = Buffer.isEncoding('base64url')

// from https://github.com/feross/typedarray-to-buffer
// licensed under MIT
/**
 * Convert a typed array to a Buffer.
 * @param arr  Typed array to convert
 */
export function typedArrayToBuffer(arr: NodeJS.TypedArray): Buffer {
    return ArrayBuffer.isView(arr) ?
    // To avoid a copy, use the typed array's underlying ArrayBuffer to back
    // new Buffer, respecting the "view", i.e. byteOffset and byteLength
        Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength) :
    // Pass through all other types to `Buffer.from`
        Buffer.from(arr)
}

/**
 * Check if two buffers are equal
 *
 * @param a  First buffer
 * @param b  Second buffer
 */
export function buffersEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

/**
 * Perform XOR operation on two buffers and return the new buffer
 *
 * @param data  Buffer to XOR
 * @param key  Key to XOR with
 */
export function xorBuffer(data: Buffer, key: Buffer): Buffer {
    const ret = Buffer.alloc(data.length)

    for (let i = 0; i < data.length; i++) {
        ret[i] = data[i] ^ key[i]
    }

    return ret
}

/**
 * Perform XOR operation on two buffers in-place
 *
 * @param data  Buffer to XOR
 * @param key  Key to XOR with
 */
export function xorBufferInPlace(data: Buffer, key: Buffer): void {
    for (let i = 0; i < data.length; i++) {
        data[i] ^= key[i]
    }
}

/**
 * Copy a buffer
 *
 * @param buf  Buffer to copy
 * @param start  Start offset
 * @param end  End offset
 */
export function cloneBuffer(buf: Buffer, start = 0, end = buf.length): Buffer {
    const ret = Buffer.alloc(end - start)
    buf.copy(ret, 0, start, end)

    return ret
}

/**
 * Parse url-safe base64 string
 *
 * @param str  String to parse
 */
export function parseUrlSafeBase64(str: string): Buffer {
    if (b64urlAvailable) {
        return Buffer.from(str, 'base64url')
    }

    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='

    return Buffer.from(str, 'base64')
}

/**
 * Convert a buffer to url-safe base64 string
 *
 * @param buf  Buffer to convert
 */
export function encodeUrlSafeBase64(buf: Buffer): string {
    if (b64urlAvailable) {
        return buf.toString('base64url')
    }

    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}
