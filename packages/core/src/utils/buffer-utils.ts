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
