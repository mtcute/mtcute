import Long from 'long'

const TWO_PWR_32_DBL = (1 << 16) * (1 << 16)

/**
 * Mapping of TL object names to writer functions.
 */
// avoid unnecessary type complexity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TlWriterMap = Record<string, (w: any, val: any) => void> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _bare?: Record<number, (w: any, val: any) => void>
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
    static countNeededBytes(
        objectMap: TlWriterMap,
        obj: { _: string },
    ): number {
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

    raw(val: Buffer): void {
        this.count += val.length
    }

    bytes(val: Buffer): void {
        this.count +=
            TlSerializationCounter.countBytesOverhead(val.length) + val.length
    }

    string(val: string): void {
        const length = Buffer.byteLength(val, 'utf8')
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
    /**
     * Underlying buffer.
     */
    buffer: Buffer

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
        buffer: Buffer,
        start = 0,
    ) {
        this.buffer = buffer
        this.pos = start
    }

    /**
     * Create a new writer with the given size.
     *
     * @param objectMap  Writers map
     * @param size  Size of the writer's buffer
     */
    static alloc(objectMap: TlWriterMap, size: number): TlBinaryWriter {
        return new TlBinaryWriter(objectMap, Buffer.allocUnsafe(size))
    }

    /**
     * Create a new writer without objects map for manual usage
     *
     * @param buffer  Buffer to write to
     * @param start  Position to start writing at
     */
    static manual(buffer: Buffer, start = 0): TlBinaryWriter {
        return new TlBinaryWriter(undefined, buffer, start)
    }

    /**
     * Create a new writer without objects map for manual usage
     * with a given size
     *
     * @param size  Size of the writer's buffer
     */
    static manualAlloc(size: number): TlBinaryWriter {
        return new TlBinaryWriter(undefined, Buffer.allocUnsafe(size))
    }

    /**
     * Serialize a single object
     *
     * @param objectMap  Writers map
     * @param obj  Object to serialize
     * @param knownSize  In case the size is known, pass it here
     */
    static serializeObject(
        objectMap: TlWriterMap,
        obj: { _: string },
        knownSize = -1,
    ): Buffer {
        if (knownSize === -1) {
            knownSize = TlSerializationCounter.countNeededBytes(objectMap, obj)
        }

        const writer = TlBinaryWriter.alloc(objectMap, knownSize)

        writer.object(obj)

        return writer.buffer
    }

    int(val: number): void {
        this.buffer.writeInt32LE(val, this.pos)
        this.pos += 4
    }

    uint(val: number): void {
        this.buffer.writeUInt32LE(val, this.pos)
        this.pos += 4
    }

    int53(val: number): void {
        // inlined fromNumber from Long
        this.buffer.writeInt32LE(val % TWO_PWR_32_DBL | 0, this.pos)

        if (val < 0) {
            this.buffer.writeInt32LE(
                (val / TWO_PWR_32_DBL - 1) | 0,
                this.pos + 4,
            )
        } else {
            this.buffer.writeInt32LE((val / TWO_PWR_32_DBL) | 0, this.pos + 4)
        }

        this.pos += 8
    }

    null(): void {
        this.uint(0x56730bcc)
    }

    long(val: Long): void {
        this.buffer.writeInt32LE(val.low, this.pos)
        this.buffer.writeInt32LE(val.high, this.pos + 4)

        this.pos += 8
    }

    float(val: number): void {
        this.buffer.writeFloatLE(val, this.pos)
        this.pos += 4
    }

    double(val: number): void {
        this.buffer.writeDoubleLE(val, this.pos)
        this.pos += 8
    }

    boolean(val: boolean): void {
        this.buffer.writeUInt32LE(val ? 0x997275b5 : 0xbc799737, this.pos)
        this.pos += 4
    }

    /**
     * Write raw bytes to the buffer
     * @param val  Buffer to write
     */
    raw(val: Buffer): void {
        val.copy(this.buffer, this.pos)
        this.pos += val.length
    }

    int128(val: Buffer): void {
        val.copy(this.buffer, this.pos)
        this.pos += 16
    }

    int256(val: Buffer): void {
        val.copy(this.buffer, this.pos)
        this.pos += 32
    }

    bytes(val: Buffer): void {
        const length = val.length
        let padding

        if (length <= 253) {
            this.buffer[this.pos++] = val.length
            padding = (length + 1) % 4
        } else {
            this.buffer[this.pos++] = 254
            this.buffer[this.pos++] = val.length & 0xff
            this.buffer[this.pos++] = (val.length >> 8) & 0xff
            this.buffer[this.pos++] = (val.length >> 16) & 0xff
            padding = length % 4
        }

        val.copy(this.buffer, this.pos)
        this.pos += val.length

        if (padding > 0) {
            padding = 4 - padding

            while (padding--) this.buffer[this.pos++] = 0
        }
    }

    string(val: string): void {
        this.bytes(Buffer.from(val, 'utf-8'))
    }

    // hot path, avoid additional runtime checks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object(obj: any): void {
        const fn = this.objectMap![obj._]
        if (!fn) throw new Error(`Unknown object ${obj._}`)
        fn(this, obj)
    }

    vector(
        fn: (item: unknown, bare?: boolean) => void,
        val: unknown[],
        bare?: boolean,
    ): void {
        if (!bare) this.uint(0x1cb5c415)
        this.uint(val.length)

        val.forEach((it) => fn.call(this, it, bare))
    }

    /**
     * Get the resulting buffer
     */
    result(): Buffer {
        return this.buffer.slice(0, this.pos)
    }
}
