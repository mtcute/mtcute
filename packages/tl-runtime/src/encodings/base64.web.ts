/// Based on https://github.com/beatgammit/base64-js, MIT license
const lookup: string[] = []
const revLookup: number[] = []

const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

for (let i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
}

function getLens(b64: string): [number, number] {
    const len = b64.length

    if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // Trim off extra bytes after placeholder bytes are found
    // See: https://github.com/beatgammit/base64-js/issues/42
    let validLen = b64.indexOf('=')
    if (validLen === -1) validLen = len

    const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4)

    return [validLen, placeHoldersLen]
}

function _byteLength(b64: string, validLen: number, placeHoldersLen: number) {
    return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen
}

function toByteArray(b64: string, arr: Uint8Array) {
    let tmp
    const lens = getLens(b64)
    const validLen = lens[0]
    const placeHoldersLen = lens[1]

    let curByte = 0

    // if there are placeholders, only get up to the last complete 4 chars
    const len = placeHoldersLen > 0 ? validLen - 4 : validLen

    let i

    for (i = 0; i < len; i += 4) {
        tmp =
            (revLookup[b64.charCodeAt(i)] << 18) |
            (revLookup[b64.charCodeAt(i + 1)] << 12) |
            (revLookup[b64.charCodeAt(i + 2)] << 6) |
            revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xff
        arr[curByte++] = (tmp >> 8) & 0xff
        arr[curByte++] = tmp & 0xff
    }

    if (placeHoldersLen === 2) {
        tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xff
    }

    if (placeHoldersLen === 1) {
        tmp =
            (revLookup[b64.charCodeAt(i)] << 10) |
            (revLookup[b64.charCodeAt(i + 1)] << 4) |
            (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xff
        arr[curByte++] = tmp & 0xff
    }

    return arr
}

function tripletToBase64(num: number) {
    return lookup[(num >> 18) & 0x3f] + lookup[(num >> 12) & 0x3f] + lookup[(num >> 6) & 0x3f] + lookup[num & 0x3f]
}

function encodeChunk(uint8: Uint8Array, start: number, end: number) {
    let tmp
    const output = []

    for (let i = start; i < end; i += 3) {
        tmp = ((uint8[i] << 16) & 0xff0000) + ((uint8[i + 1] << 8) & 0xff00) + (uint8[i + 2] & 0xff)
        output.push(tripletToBase64(tmp))
    }

    return output.join('')
}

function fromByteArray(uint8: Uint8Array) {
    let tmp
    const len = uint8.length
    const extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
    const parts = []
    const maxChunkLength = 16383 // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength))
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + '==')
    } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(lookup[tmp >> 10] + lookup[(tmp >> 4) & 0x3f] + lookup[(tmp << 2) & 0x3f] + '=')
    }

    return parts.join('')
}

export function base64Encode(buf: Uint8Array, url = false): string {
    const str = fromByteArray(buf)
    if (url) return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    return str
}

export function base64Decode(buf: Uint8Array, string: string, url = false): void {
    if (url) {
        string = string.replace(/-/g, '+').replace(/_/g, '/')
        while (string.length % 4) string += '='
    }

    const res = toByteArray(string, buf)
    buf.set(res)
}

export function base64DecodeToBuffer(string: string, url = false): Uint8Array {
    if (url) {
        string = string.replace(/-/g, '+').replace(/_/g, '/')
        while (string.length % 4) string += '='
    }

    const buf = new Uint8Array(_byteLength(string, ...getLens(string)))

    toByteArray(string, buf)

    return buf
}
