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
