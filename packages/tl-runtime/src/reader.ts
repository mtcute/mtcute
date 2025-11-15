import { utf8 } from '@fuman/utils'
import Long from 'long'

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
// avoid unnecessary type complexity
export type TlReaderMap = Record<number, (r: any) => unknown> & {
  _results?: Record<string, (r: any) => unknown>
}

export class TlUnknownObjectError extends Error {
  constructor(readonly objectId: number) {
    super(`Unknown object id: 0x${objectId.toString(16)}`)
  }
}

/**
 * Reader for TL objects.
 */
export class TlBinaryReader {
  readonly dataView: DataView
  readonly uint8View: Uint8Array

  pos = 0

  _objectMapper?: (obj: any) => any

  /**
   * @param objectsMap  Readers map
   * @param data  Buffer to read from
   * @param start  Position to start reading from
   */
  constructor(
    readonly objectsMap: TlReaderMap | undefined,
    data: ArrayBuffer | ArrayBufferView,
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
   * Create a new reader without objects map for manual usage
   *
   * @param data  Buffer to read from
   * @param start  Position to start reading from
   */
  static manual(data: ArrayBuffer | ArrayBufferView, start = 0): TlBinaryReader {
    return new TlBinaryReader(undefined, data, start)
  }

  /**
   * Deserialize a single object
   *
   * @param objectsMap  Readers map
   * @param data  Buffer to read from
   * @param start  Position to start reading from
   */
  static deserializeObject<T>(objectsMap: TlReaderMap, data: Uint8Array, start = 0): T {
    return new TlBinaryReader(objectsMap, data, start).object() as T
  }

  int(): number {
    const res = this.dataView.getInt32(this.pos, true)
    this.pos += 4

    return res
  }

  uint(): number {
    const res = this.dataView.getUint32(this.pos, true)
    this.pos += 4

    return res
  }

  /**
   * Get the next {@link uint} without advancing the reader cursor
   */
  peekUint(): number {
    // e.g. for checking ctor number
    return this.dataView.getUint32(this.pos, true)
  }

  int53(): number {
    // inlined toNumber from Long
    const res = (this.dataView.getInt32(this.pos, true) >>> 0)
      + TWO_PWR_32_DBL * this.dataView.getInt32(this.pos + 4, true)
    this.pos += 8

    return res
  }

  long(unsigned = false): Long {
    const lo = this.dataView.getInt32(this.pos, true)
    const hi = this.dataView.getInt32(this.pos + 4, true)

    this.pos += 8

    return new Long(lo, hi, unsigned)
  }

  float(): number {
    const res = this.dataView.getFloat32(this.pos, true)
    this.pos += 4

    return res
  }

  double(): number {
    const res = this.dataView.getFloat64(this.pos, true)
    this.pos += 8

    return res
  }

  boolean(): boolean {
    const val = this.uint()
    if (val === 0xBC799737) return false
    if (val === 0x997275B5) return true
    throw new Error(`Expected either boolTrue or boolFalse, got 0x${val.toString(16)}`)
  }

  /**
   * Read raw bytes of the given length
   * @param bytes  Length of the buffer to read
   */
  raw(bytes = -1): Uint8Array {
    if (bytes === -1) bytes = this.uint8View.length - this.pos

    return this.uint8View.subarray(this.pos, (this.pos += bytes))
  }

  int128(): Uint8Array {
    return this.uint8View.subarray(this.pos, (this.pos += 16))
  }

  int256(): Uint8Array {
    return this.uint8View.subarray(this.pos, (this.pos += 32))
  }

  bytes(): Uint8Array {
    const firstByte = this.uint8View[this.pos++]
    let length
    let padding

    if (firstByte === 254) {
      length = this.uint8View[this.pos++] | (this.uint8View[this.pos++] << 8) | (this.uint8View[this.pos++] << 16)
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
    return utf8.decoder.decode(this.bytes())
  }

  object(id: number = this.uint()): unknown {
    if (id === 0x1CB5C415 /* vector */) {
      return this.vector(this.object, true)
    }
    if (id === 0xBC799737 /* boolFalse */) return false
    if (id === 0x997275B5 /* boolTrue */) return true
    // unsure if it is actually used in the wire, seems like it's only used for boolean flags
    if (id === 0x3FEDD339 /* true */) return true
    // never used in the actual schema, but whatever
    if (id === 0x56730BCC /* null */) return null

    // hot path, avoid additional runtime checks

    const reader = this.objectsMap![id]

    if (!reader) {
      // unknown type. bruh moment.
      // mtproto sucks and there's no way we can just skip it
      this.seek(-4)
      const pos = this.pos
      const error = new TlUnknownObjectError(id)
      this.pos = pos
      throw error
    }

    return reader(this)
  }

  vector(reader: (id?: number) => unknown = this.object, bare = false): unknown[] {
    if (!bare) {
      const uint = this.uint()

      if (uint !== 0x1CB5C415) {
        throw new Error(
          `Invalid object code, expected 0x1cb5c415 (vector), got 0x${uint.toString(16)} at ${this.pos - 4}`,
        )
      }
    }

    const length = this.uint()
    const ret = []
    for (let i = 0; i < length; i++) ret.push(reader.call(this))

    return ret
  }

  /**
   * Advance the reader cursor by the given amount of bytes
   *
   * @param delta  Amount of bytes to advance (can be negative)
   */
  seek(delta: number): void {
    this.seekTo(this.pos + delta)
  }

  /**
   * Seek to the given position
   *
   * @param pos  Position to seek to
   */
  seekTo(pos: number): void {
    if (pos >= this.uint8View.length || pos < 0) {
      throw new RangeError('New position is out of range')
    }
    this.pos = pos
  }
}
