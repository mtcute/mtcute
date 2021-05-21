import { BigInteger } from 'big-integer'
import { longToUlong, ulongToLong, writeBigInt } from '../bigint-utils'
import writerMap, {
    ITlBinaryWriter,
    TlBinaryWriterFunction,
    TlWriterMap,
} from '@mtcute/tl/binary/writer'

type SerializableObject = {
    _: string
    [key: string]: any
}

const isNativeBigIntAvailable = typeof BigInt !== 'undefined' && 'writeBigInt64LE' in Buffer.prototype

function utf8ByteLength (string: string): number {
    let codePoint
    const length = string.length
    let leadSurrogate = null
    let bytes = 0

    for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i)

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
                // no lead yet
                if (codePoint > 0xDBFF) {
                    // unexpected trail
                    bytes += 3
                    continue
                } else if (i + 1 === length) {
                    // unpaired lead
                    bytes += 3
                    continue
                }

                // valid lead
                leadSurrogate = codePoint

                continue
            }

            // 2 leads in a row
            if (codePoint < 0xDC00) {
                bytes += 3
                leadSurrogate = codePoint
                continue
            }

            // valid surrogate pair
            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
        } else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            bytes += 3
        }

        leadSurrogate = null

        // encode utf8
        if (codePoint < 0x80) {
            bytes += 1
        } else if (codePoint < 0x800) {
            bytes += 2
        } else if (codePoint < 0x10000) {
            bytes += 3
        } else if (codePoint < 0x110000) {
            bytes += 4
        } else {
            throw new Error('Invalid code point')
        }
    }

    return bytes
}

// buffer package for the web detects size by writing the string to an array and checking size
// that is slow.
// see https://github.com/feross/buffer/blob/795bbb5bda1b39f1370ebd784bea6107b087e3a7/index.js#L527
const utfLength = (Buffer.prototype as any)._isBuffer ? utf8ByteLength : Buffer.byteLength

export class SerializationCounter implements ITlBinaryWriter {
    count = 0
    _objectMap = writerMap

    static countNeededBytes(
        obj: SerializableObject,
        objectMap?: TlWriterMap
    ): number {
        const cnt = new SerializationCounter()
        if (objectMap) cnt._objectMap = objectMap
        cnt.object(obj)
        return cnt.count
    }

    boolean(val: boolean): void {
        this.count += 4
    }

    double(val: number): void {
        this.count += 8
    }

    float(val: number): void {
        this.count += 4
    }

    int128(val: Buffer): void {
        this.count += 16
    }

    int256(val: Buffer): void {
        this.count += 32
    }

    int32(val: number): void {
        this.count += 4
    }

    uint32(val: number): void {
        this.count += 4
    }

    long(val: BigInteger): void {
        this.count += 8
    }

    rawLong(val: Buffer): void {
        this.count += 8
    }

    raw(val: Buffer): void {
        this.count += val.length
    }

    bytes(val: Buffer): void {
        let padding
        if (val.length <= 253) {
            this.count += 1
            padding = (val.length + 1) % 4
        } else {
            this.count += 4
            padding = val.length % 4
        }

        if (padding > 0) this.count += 4 - padding
        this.count += val.length
    }

    string(val: string): void {
        const length = utfLength(val)
        let padding
        if (length <= 253) {
            this.count += 1
            padding = (length + 1) % 4
        } else {
            this.count += 4
            padding = length % 4
        }

        if (padding > 0) this.count += 4 - padding
        this.count += length
    }

    object(obj: SerializableObject, bare?: boolean): void {
        if (!this._objectMap[obj._]) throw new Error(`Unknown object ${obj._}`)
        this._objectMap[obj._].call(this, obj, bare)
    }

    vector(fn: TlBinaryWriterFunction, items: unknown[], bare?: boolean): void {
        this.count += bare ? 4 : 8
        items.forEach((it) => fn.call(this, it))
    }
}

export class BinaryWriter implements ITlBinaryWriter {
    _objectMap = writerMap
    buffer: Buffer
    pos: number

    constructor(buffer: Buffer, start = 0) {
        this.buffer = buffer
        this.pos = start
    }

    static alloc(size: number): BinaryWriter {
        return new BinaryWriter(Buffer.allocUnsafe(size))
    }

    static serializeObject(
        obj: SerializableObject,
        knownSize = -1,
        objectMap?: any
    ): Buffer {
        if (knownSize === -1)
            knownSize = SerializationCounter.countNeededBytes(obj)

        const writer = BinaryWriter.alloc(knownSize)
        if (objectMap) writer._objectMap = objectMap

        writer.object(obj)
        return writer.buffer
    }

    int32(val: number): void {
        this.buffer.writeInt32LE(val, this.pos)
        this.pos += 4
    }

    uint32(val: number): void {
        this.buffer.writeUInt32LE(val, this.pos)
        this.pos += 4
    }

    long(val: BigInteger): void {
        if (isNativeBigIntAvailable) {
            val = ulongToLong(val)
            // if BigInt is supported, `BigInteger` is just a
            // wrapper over native BigInt, stored in `value`
            this.buffer.writeBigInt64LE((val as any).value, this.pos)
        } else {
            val = longToUlong(val)
            writeBigInt(this.buffer, val, 8, this.pos, true)
        }

        this.pos += 8
    }

    rawLong(val: Buffer): void {
        val.copy(this.buffer, this.pos)
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

    object(obj: SerializableObject, bare?: boolean): void {
        if (!this._objectMap[obj._]) throw new Error(`Unknown object ${obj._}`)
        this._objectMap[obj._].call(this, obj, bare)
    }

    vector(fn: TlBinaryWriterFunction, val: unknown[]): void {
        this.uint32(0x1cb5c415)
        this.uint32(val.length)

        val.forEach((it) => fn.call(this, it))
    }

    result(): Buffer {
        return this.buffer.slice(0, this.pos)
    }
}
