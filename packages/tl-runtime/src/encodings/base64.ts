/* eslint-disable no-restricted-globals */

export const BUFFER_BASE64_URL_AVAILABLE = Buffer.isEncoding('base64url')

export function base64Encode(buf: Uint8Array, url = false): string {
    const nodeBuffer = Buffer.from(
        buf.buffer,
        buf.byteOffset,
        buf.byteLength,
    )

    if (url && BUFFER_BASE64_URL_AVAILABLE) return nodeBuffer.toString('base64url')

    const str = nodeBuffer.toString('base64')
    if (url) return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    return str
}

export function base64DecodeToBuffer(string: string, url = false): Uint8Array {
    let buffer

    if (url && BUFFER_BASE64_URL_AVAILABLE) {
        buffer = Buffer.from(string, 'base64url')
    } else {
        buffer = Buffer.from(string, 'base64')

        if (url) {
            string = string.replace(/-/g, '+').replace(/_/g, '/')
            while (string.length % 4) string += '='
        }
    }

    return buffer
}

export function base64Decode(buf: Uint8Array, string: string, url = false): void {
    (base64DecodeToBuffer(string, url) as Buffer).copy(buf)
}
