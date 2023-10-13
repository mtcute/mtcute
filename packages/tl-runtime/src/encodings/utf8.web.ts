export function byteLengthUtf8(str: string) {
    return new TextEncoder().encode(str).length
}

export function utf8Decode(buf: Uint8Array): string {
    return new TextDecoder('utf8').decode(buf)
}

export function utf8Encode(buf: Uint8Array, str: string) {
    return new TextEncoder().encodeInto(str, buf)
}

export function utf8EncodeToBuffer(str: string): Uint8Array {
    return new TextEncoder().encode(str)
}
