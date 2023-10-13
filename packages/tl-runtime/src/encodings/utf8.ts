/* eslint-disable no-restricted-globals */

export function byteLengthUtf8(str: string) {
    return Buffer.byteLength(str, 'utf8')
}

export function utf8Decode(buf: Uint8Array): string {
    return Buffer.from(
        buf.buffer,
        buf.byteOffset,
        buf.byteLength,
    ).toString('utf8')
}

export function utf8Encode(buf: Uint8Array, str: string) {
    return Buffer.from(str, 'utf8').copy(buf)
}

export function utf8EncodeToBuffer(str: string): Uint8Array {
    return Buffer.from(str, 'utf8')
}
