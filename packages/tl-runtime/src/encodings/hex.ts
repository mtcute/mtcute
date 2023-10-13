/* eslint-disable no-restricted-globals */

export function hexEncode(buf: Uint8Array): string {
    return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).toString('hex')
}

export function hexDecodeToBuffer(string: string): Uint8Array {
    return Buffer.from(string, 'hex')
}

export function hexDecode(buf: Uint8Array, string: string): number {
    return (hexDecodeToBuffer(string) as Buffer).copy(buf)
}
