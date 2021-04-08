export let nodeCrypto: any = null
if (typeof process !== 'undefined' && typeof require !== 'undefined') {
    try {
        nodeCrypto = require('crypto')
    } catch (e) {}
}

// from https://github.com/feross/typedarray-to-buffer
// licensed under MIT
export function typedArrayToBuffer(arr: NodeJS.TypedArray): Buffer {
    return ArrayBuffer.isView(arr)
        ? // To avoid a copy, use the typed array's underlying ArrayBuffer to back
          // new Buffer, respecting the "view", i.e. byteOffset and byteLength
          Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)
        : // Pass through all other types to `Buffer.from`
          Buffer.from(arr)
}

export function reverseBuffer(buffer: Buffer): Buffer {
    for (let i = 0, j = buffer.length - 1; i < j; ++i, --j) {
        const t = buffer[j]

        buffer[j] = buffer[i]
        buffer[i] = t
    }

    return buffer
}

export function buffersEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

export function xorBuffer(data: Buffer, key: Buffer): Buffer {
    const ret = Buffer.alloc(data.length)
    for (let i = 0; i < data.length; i++) {
        ret[i] = data[i] ^ key[i]
    }
    return ret
}

export function xorBufferInPlace(data: Buffer, key: Buffer): void {
    for (let i = 0; i < data.length; i++) {
        data[i] ^= key[i]
    }
}

export function randomBytes(size: number): Buffer {
    if (nodeCrypto) return nodeCrypto.randomBytes(size)

    const ret = new Uint8Array(size)
    crypto.getRandomValues(ret)
    return typedArrayToBuffer(ret)
}

export function cloneBuffer(buf: Buffer, start = 0, end = buf.length): Buffer {
    const ret = Buffer.alloc(end - start)
    buf.copy(ret, 0, start, end)
    return ret
}

export function parseUrlSafeBase64(str: string): Buffer {
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    return Buffer.from(str, 'base64')
}

export function encodeUrlSafeBase64(buf: Buffer): string {
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

// telegram has some cursed RLE which only encodes consecutive \x00

export function telegramRleEncode(buf: Buffer): Buffer {
    const len = buf.length
    const ret: number[] = []
    let count = 0

    for (let i = 0; i < len; i++) {
        const cur = buf[i]
        if (cur === 0) {
            count += 1
        } else {
            if (count > 0) {
                ret.push(0, count)
                count = 0
            }

            ret.push(cur)
        }
    }

    if (count > 0) {
        ret.push(0, count)
    }

    return Buffer.from(ret)
}

export function telegramRleDecode(buf: Buffer): Buffer {
    const len = buf.length
    const ret: number[] = []
    let prev = -1

    for (let i = 0; i < len; i++) {
        const cur = buf[i]
        if (prev === 0) {
            for (let j = 0; j < cur; j++) {
                ret.push(prev)
            }
            prev = -1
        } else {
            if (prev !== -1) ret.push(prev)
            prev = cur
        }
    }

    if (prev !== -1) ret.push(prev)
    return Buffer.from(ret)
}
