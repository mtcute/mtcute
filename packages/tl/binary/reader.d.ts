import { BigInteger } from 'big-integer'

/**
 * Interface describing binary reader compatible with @mtcute/tl
 * generated binary readers
 */
export interface ITlBinaryReader {
    /** Read 32-bit signed integer from the source */
    int32(): number

    /** Read 32-bit unsigned integer from the source */
    uint32(): number

    /** Read 64-bit (un-)signed integer from the source */
    long(unsigned?: boolean): BigInteger

    /** Read 64-bit usigned integer from the source */
    ulong(): BigInteger

    /** Read 64-bit integer as a byte array */
    rawLong(): Buffer

    /** Read 32-bit floating point value */
    float(): number

    /** Read 64-bit floating point value */
    double(): number

    /**
     * Read TL-encoded boolean
     * - `0xbc799737` = false
     * - `0x997275b5` = true
     */
    boolean(): boolean

    /** Read 128-bit integer as a byte array */
    int128(): Buffer

    /** Read 256-bit integer as a byte array */
    int256(): Buffer

    /** Read TL-encoded byte array (see [TL Base Types](https://core.telegram.org/mtproto/serialize#base-types)) */
    bytes(): Buffer

    /** Read TL-encoded string (see [TL Base Types](https://core.telegram.org/mtproto/serialize#base-types)) */
    string(): string

    /** Read TL object */
    object(): any

    /** Read {@link bytes | this.bytes()} and gunzip it */
    gzip(): any

    /**
     * Read a TL-encoded array of items.
     *
     * @param reader  Function used for reading
     * @param bare  Whether the vector is bare (i.e. vector ID is not present)
     */
    vector(reader?: TlBinaryReaderFunction, bare?: boolean): unknown[]
}

export type TlBinaryReaderFunction = (this: ITlBinaryReader) => unknown

/**
 * Mapping of TL object IDs to reader functions.
 *
 * Note that these types will never be present in the map
 * and must be parsed manually inside `.object()`:
 * - `0x1cb5c415` aka `vector`
 * - `0x3072cfa1` aka `gzip_packed`
 * - `0xbc799737` aka `boolFalse`
 * - `0x997275b5` aka `boolTrue`
 * - `0x3fedd339` aka `true`
 * - `0x56730bcc` aka `null`
 */
export type TlReaderMap = Record<number, TlBinaryReaderFunction>

declare const __tlReaderMap: TlReaderMap
export default __tlReaderMap
