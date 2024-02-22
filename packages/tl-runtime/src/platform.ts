/**
 * Platform-specific functions used by {@link TlBinaryReader} and {@link TlBinaryWriter}
 */
export interface ITlPlatform {
    utf8Encode(str: string): Uint8Array
    utf8Decode(buf: Uint8Array): string
    utf8ByteLength(str: string): number
}
