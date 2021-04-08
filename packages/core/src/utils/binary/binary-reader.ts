import bigInt, { BigInteger } from 'big-integer'
import { inflate } from 'pako'
import { typedArrayToBuffer } from '../buffer-utils'
import readerMap, { ITlBinaryReader } from '@mtcute/tl/binary/reader'
import { ulongToLong } from '../bigint-utils'
import { tl } from '@mtcute/tl'

export class BinaryReader implements ITlBinaryReader {
    data: Buffer
    pos = 0

    _objectsMap = readerMap

    constructor(data: Buffer, start = 0) {
        this.data = data
        this.pos = start
    }

    static deserializeObject<T = tl.TlObject>(data: Buffer, start = 0): T {
        return new BinaryReader(data, start).object()
    }

    int32(): number {
        const res = this.data.readInt32LE(this.pos)
        this.pos += 4
        return res
    }

    uint32(): number {
        const res = this.data.readUInt32LE(this.pos)
        this.pos += 4
        return res
    }

    long(unsigned = false): BigInteger {
        const lo = this.data.readUInt32LE(this.pos)
        const hi = this.data.readUInt32LE(this.pos + 4)
        this.pos += 8

        let big = bigInt(hi).shiftLeft(32).or(lo)
        if (!unsigned) big = ulongToLong(big)
        return big
    }

    // for use in generated code
    ulong(): BigInteger {
        return this.long(true)
    }

    rawLong(): Buffer {
        return this.data.slice(this.pos, (this.pos += 8))
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
        const val = this.uint32()
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
        if (padding > 0) this.raw(4 - padding)

        return data
    }

    string(): string {
        return this.bytes().toString('utf-8')
    }

    object(): any {
        const id = this.uint32()

        if (id === 0x1cb5c415 /* vector */)
            return this.vector(this.object, true)
        if (id === 0x3072cfa1 /* gzip_packed */) return this.gzip()
        if (id === 0xbc799737 /* boolFalse */) return false
        if (id === 0x997275b5 /* boolTrue */) return true
        // unsure if it is actually used in the wire, seems like it's only used for boolean flags
        if (id === 0x3fedd339 /* true */) return true
        // never used in the actual schema, but whatever
        if (id === 0x56730bcc /* null */) return null

        const reader = this._objectsMap[id]
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

        return reader.call(this)
    }

    gzip(): any {
        return new BinaryReader(
            typedArrayToBuffer(inflate(this.bytes()))
        ).object()
    }

    vector(reader = this.object, bare = false): any[] {
        if (!bare) {
            if (this.uint32() !== 0x1cb5c415)
                throw new Error(
                    'Invalid object code, expected 0x1cb5c415 (vector)'
                )
        }

        const length = this.uint32()
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
