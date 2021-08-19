import { BigInteger } from 'big-integer'

/**
 * Interface describing binary writer compatible with @mtcute/tl
 * generated binary writers
 */
export interface ITlBinaryWriter {
    /** Write signed 32-bit integer to the stream */
    int32(val: number): void

    /** Write unsigned 32-bit integer to the stream */
    uint32(val: number): void

    /** Write signed 64-bit integer to the stream */
    long(val: BigInteger): void

    /** Write signed 64-bit integer from buffer to the stream */
    rawLong(val: Buffer): void

    /** Write 32-bit floating point value to the stream */
    float(val: number): void

    /** Write 64-bit floating point value to the stream */
    double(val: number): void

    /**
     * Write TL-encoded boolean to the stream
     * - `0xbc799737` = false
     * - `0x997275b5` = true
     */
    boolean(val: boolean): void

    /** Write 128-bit integer as a buffer to the stream */
    int128(val: Buffer): void

    /** Write 256-bit integer as a buffer to the stream */
    int256(val: Buffer): void

    /** Write TL-encoded byte array to the stream (see [TL Base Types](https://core.telegram.org/mtproto/serialize#base-types)) */
    bytes(val: Buffer): void

    /** Write TL-encoded string to the stream (see [TL Base Types](https://core.telegram.org/mtproto/serialize#base-types))*/
    string(val: string): void

    /** Write TL object */
    object(obj: unknown, bare?: boolean): void

    /**
     * Write an array of TL objects
     *
     * @param fn  Writer function
     * @param items  Items to be written
     * @param bare  Whether the vector is bare (i.e. object ID should not be written)
     */
    vector(fn: TlBinaryWriterFunction, items: unknown[], bare?: boolean): void
}

export type TlBinaryWriterFunction = (
    this: ITlBinaryWriter,
    obj: unknown,
    bare?: boolean
) => void

/**
 * Mapping of TL object names to writer functions.
 */
export type TlWriterMap = Record<string, TlBinaryWriterFunction>

declare const __tlWriterMap: TlWriterMap
export default __tlWriterMap
