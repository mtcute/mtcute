import Long from 'long'

import { gzipInflate } from './platform/gzip'

const TWO_PWR_32_DBL = (1 << 16) * (1 << 16)

/**
 * Mapping of TL object IDs to reader functions.
 *
 * Note that these types should never be present in the map
 * and are parsed manually inside `.object()`:
 * - `0x1cb5c415` aka `vector`
 * - `0x3072cfa1` aka `gzip_packed`
 * - `0xbc799737` aka `boolFalse`
 * - `0x997275b5` aka `boolTrue`
 * - `0x3fedd339` aka `true`
 * - `0x56730bcc` aka `null`
 */
export type TlReaderMap = Record<number, (r: any) => any>

export class TlBinaryReader {
    data: Buffer
    pos = 0

    constructor(
        readonly objectsMap: TlReaderMap | undefined,
        data: Buffer,
        start = 0
    ) {
        this.data = data
        this.pos = start
    }

    static manual(data: Buffer, start = 0): TlBinaryReader {
        return new TlBinaryReader(undefined, data, start)
    }

    static deserializeObject(
        objectsMap: TlReaderMap,
        data: Buffer,
        start = 0
    ): any {
        return new TlBinaryReader(objectsMap, data, start).object()
    }

    int(): number {
        const res = this.data.readInt32LE(this.pos)
        this.pos += 4
        return res
    }

    uint(): number {
        const res = this.data.readUInt32LE(this.pos)
        this.pos += 4
        return res
    }

    peekUint(): number {
        // e.g. for checking ctor number
        return this.data.readUInt32LE(this.pos)
    }

    int53(): number {
        // inlined toNumber from Long
        const res =
            (this.data.readInt32LE(this.pos) >>> 0) +
            TWO_PWR_32_DBL * this.data.readInt32LE(this.pos + 4)
        this.pos += 8
        return res
    }

    long(unsigned = false): Long {
        const lo = this.data.readInt32LE(this.pos)
        const hi = this.data.readInt32LE(this.pos + 4)

        this.pos += 8
        return new Long(lo, hi, unsigned)
    }

    float(): number {
        const res = this.data.readFloatLE(this.pos)
        this.pos += 4
        return res
    }

    double(): number {
        const res = this.data.readDoubleLE(this.pos)
        this.pos += 8
        return res
    }

    boolean(): boolean {
        const val = this.uint()
        if (val === 0xbc799737) return false
        if (val === 0x997275b5) return true
        throw new Error(
            `Expected either boolTrue or boolFalse, got 0x${val.toString(16)}`
        )
    }

    raw(bytes = -1): Buffer {
        if (bytes === -1) bytes = this.data.length - this.pos

        return this.data.slice(this.pos, (this.pos += bytes))
    }

    int128(): Buffer {
        return this.data.slice(this.pos, (this.pos += 16))
    }

    int256(): Buffer {
        return this.data.slice(this.pos, (this.pos += 32))
    }

    bytes(): Buffer {
        const firstByte = this.data[this.pos++]
        let length, padding
        if (firstByte === 254) {
            length =
                this.data[this.pos++] |
                (this.data[this.pos++] << 8) |
                (this.data[this.pos++] << 16)
            padding = length % 4
        } else {
            length = firstByte
            padding = (length + 1) % 4
        }

        const data = this.raw(length)
        if (padding > 0) this.pos += 4 - padding

        return data
    }

    string(): string {
        return this.bytes().toString('utf-8')
    }

    object(): any {
        const id = this.uint()

        if (id === 0x1cb5c415 /* vector */)
            return this.vector(this.object, true)
        if (id === 0x3072cfa1 /* gzip_packed */) return this.gzip()
        if (id === 0xbc799737 /* boolFalse */) return false
        if (id === 0x997275b5 /* boolTrue */) return true
        // unsure if it is actually used in the wire, seems like it's only used for boolean flags
        if (id === 0x3fedd339 /* true */) return true
        // never used in the actual schema, but whatever
        if (id === 0x56730bcc /* null */) return null

        const reader = this.objectsMap![id]
        if (!reader) {
            // unknown type. bruh moment.
            // mtproto sucks and there's no way we can just skip it
            this.seek(-4)
            const pos = this.pos
            const error = new TypeError(
                `Unknown object id: 0x${id.toString(
                    16
                )}. Content: ${this.raw().toString('hex')}`
            )
            this.pos = pos
            throw error
        }

        return reader(this)
    }

    gzip(): any {
        return new TlBinaryReader(
            this.objectsMap,
            gzipInflate(this.bytes())
        ).object()
    }

    vector(reader = this.object, bare = false): any[] {
        if (!bare) {
            if (this.uint() !== 0x1cb5c415)
                throw new Error(
                    'Invalid object code, expected 0x1cb5c415 (vector)'
                )
        }

        const length = this.uint()
        const ret = []
        for (let i = 0; i < length; i++) ret.push(reader.call(this))
        return ret
    }

    seek(delta: number): void {
        this.seekTo(this.pos + delta)
    }

    seekTo(pos: number): void {
        if (pos >= this.data.length || pos < 0)
            throw new RangeError('New position is out of range')
        this.pos = pos
    }
}
