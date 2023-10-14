import Long from 'long'

import { byteLengthUtf8, utf8EncodeToBuffer } from './encodings/utf8.js'

const TWO_PWR_32_DBL = (1 << 16) * (1 << 16)

/**
 * Mapping of TL object names to writer functions.
 */
// avoid unnecessary type complexity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TlWriterMap = Record<string, (w: any, val: any) => void> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _bare?: Record<number, (w: any, val: any) => void>
    _staticSize: Record<string, number>
}

/**
 * Counter of the required number of bytes to encode a given object.
 *
 * Used as a pre-pass before using {@link TlBinaryWriter}
 * to avoid unnecessary allocations.
 */
export class TlSerializationCounter {
    count = 0

    /**
     * @param objectMap  Writers map
     */
    constructor(readonly objectMap: TlWriterMap) {}

    /**
     * Count bytes required to serialize the given object.
     *
     * @param objectMap  Writers map
     * @param obj  Object to count bytes for
     */
    static countNeededBytes(objectMap: TlWriterMap, obj: { _: string }): number {
        const cnt = new TlSerializationCounter(objectMap)
        cnt.object(obj)

        return cnt.count
    }

    /**
     * Count overhead in bytes for the given number of bytes when
     * encoded as `bytes` TL type.
     *
     * @param size  Number of bytes
     */
    static countBytesOverhead(size: number): number {
        let res = 0

        let padding

        if (size <= 253) {
            res += 1
            padding = (size + 1) % 4
        } else {
            res += 4
            padding = size % 4
        }

        if (padding > 0) res += 4 - padding

        return res
    }

    boolean(): void {
        this.count += 4
    }

    double(): void {
        this.count += 8
    }

    float(): void {
        this.count += 4
    }

    int128(): void {
        this.count += 16
    }

    int256(): void {
        this.count += 32
    }

    int(): void {
        this.count += 4
    }

    uint(): void {
        this.count += 4
    }

    int53(): void {
        this.count += 8
    }

    long(): void {
        this.count += 8
    }

    null(): void {
        this.count += 4
    }

    raw(val: Uint8Array): void {
        this.count += val.byteLength
    }

    bytes(val: Uint8Array): void {
        this.count += TlSerializationCounter.countBytesOverhead(val.length) + val.length
    }

    string(val: string): void {
        const length = byteLengthUtf8(val)
        this.count += TlSerializationCounter.countBytesOverhead(length) + length
    }

    object(obj: { _: string }): void {
        if (!this.objectMap[obj._]) throw new Error(`Unknown object ${obj._}`)
        this.objectMap[obj._](this, obj)
    }

    vector(fn: (item: unknown) => void, items: unknown[]): void {
        this.count += 8
        items.forEach((it) => fn.call(this, it))
    }
}

/**
 * Writer for TL objects.
 */
export class TlBinaryWriter {
    readonly dataView: DataView
    readonly uint8View: Uint8Array

    /**
     * Current position in the buffer.
     */
    pos: number

    /**
     * @param objectMap  Writers map
     * @param buffer  Buffer to write to
     * @param start  Position to start writing at
     */
    constructor(
        readonly objectMap: TlWriterMap | undefined,
        data: ArrayBuffer,
        start = 0,
    ) {
        if (ArrayBuffer.isView(data)) {
            this.pos = start
            this.dataView = new DataView(data.buffer, data.byteOffset, data.byteLength)
            this.uint8View = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        } else {
            this.pos = start
            this.dataView = new DataView(data)
            this.uint8View = new Uint8Array(data)
        }
    }

    /**
     * Create a new writer with the given size.
     *
     * @param objectMap  Writers map
     * @param size  Size of the writer's buffer
     */
    static alloc(objectMap: TlWriterMap | undefined, size: number): TlBinaryWriter {
        return new TlBinaryWriter(objectMap, new ArrayBuffer(size))
    }

    /**
     * Create a new writer without objects map for manual usage
     *
     * @param buffer  Buffer to write to, or its size
     * @param start  Position to start writing at
     */
    static manual(buffer: ArrayBuffer | number, start = 0): TlBinaryWriter {
        if (typeof buffer === 'number') buffer = new ArrayBuffer(buffer)

        return new TlBinaryWriter(undefined, buffer, start)
    }

    /**
     * Serialize a single object
     *
     * @param objectMap  Writers map
     * @param obj  Object to serialize
     * @param knownSize  In case the size is known, pass it here
     */
    static serializeObject(objectMap: TlWriterMap, obj: { _: string }, knownSize = -1): Uint8Array {
        if (knownSize === -1) {
            knownSize = objectMap._staticSize[obj._] || TlSerializationCounter.countNeededBytes(objectMap, obj)
        }

        const writer = TlBinaryWriter.alloc(objectMap, knownSize)

        writer.object(obj)

        return writer.uint8View
    }

    int(val: number): void {
        this.dataView.setInt32(this.pos, val, true)
        this.pos += 4
    }

    uint(val: number): void {
        this.dataView.setUint32(this.pos, val, true)
        this.pos += 4
    }

    int53(val: number): void {
        // inlined fromNumber from Long
        this.dataView.setInt32(this.pos, val % TWO_PWR_32_DBL | 0, true)

        if (val < 0) {
            this.dataView.setInt32(this.pos + 4, (val / TWO_PWR_32_DBL - 1) | 0, true)
        } else {
            this.dataView.setInt32(this.pos + 4, (val / TWO_PWR_32_DBL) | 0, true)
        }

        this.pos += 8
    }

    null(): void {
        this.uint(0x56730bcc)
    }

    long(val: Long): void {
        this.dataView.setInt32(this.pos, val.low, true)
        this.dataView.setInt32(this.pos + 4, val.high, true)

        this.pos += 8
    }

    float(val: number): void {
        this.dataView.setFloat32(this.pos, val, true)
        this.pos += 4
    }

    double(val: number): void {
        this.dataView.setFloat64(this.pos, val, true)
        this.pos += 8
    }

    boolean(val: boolean): void {
        this.dataView.setInt32(this.pos, val ? 0x997275b5 : 0xbc799737, true)
        this.pos += 4
    }

    /**
     * Write raw bytes to the buffer
     * @param val  Buffer to write
     */
    raw(val: Uint8Array): void {
        this.uint8View.set(val, this.pos)
        this.pos += val.byteLength
    }

    int128(val: Uint8Array): void {
        if (val.byteLength !== 16) throw new Error('Invalid int128 length')
        this.raw(val)
    }

    int256(val: Uint8Array): void {
        if (val.byteLength !== 32) throw new Error('Invalid int256 length')
        this.raw(val)
    }

    bytes(val: Uint8Array): void {
        const length = val.byteLength
        let padding

        if (length <= 253) {
            this.uint8View[this.pos++] = length
            padding = (length + 1) % 4
        } else {
            this.uint8View[this.pos++] = 254
            this.uint8View[this.pos++] = length & 0xff
            this.uint8View[this.pos++] = (length >> 8) & 0xff
            this.uint8View[this.pos++] = (length >> 16) & 0xff
            padding = length % 4
        }

        this.uint8View.set(val, this.pos)
        this.pos += length

        if (padding > 0) {
            padding = 4 - padding

            while (padding--) this.uint8View[this.pos++] = 0
        }
    }

    string(val: string): void {
        this.bytes(utf8EncodeToBuffer(val))
    }

    // hot path, avoid additional runtime checks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object(obj: any): void {
        const fn = this.objectMap![obj._]
        if (!fn) throw new Error(`Unknown object ${obj._}`)
        fn(this, obj)
    }

    vector(fn: (item: unknown, bare?: boolean) => void, val: unknown[], bare?: boolean): void {
        if (!bare) this.uint(0x1cb5c415)
        this.uint(val.length)

        val.forEach((it) => fn.call(this, it, bare))
    }

    /**
     * Get the resulting buffer
     */
    result(): Uint8Array {
        return this.uint8View.subarray(0, this.pos)
    }
}
