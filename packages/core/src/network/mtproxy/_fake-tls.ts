import type { ISyncWritable } from '@fuman/io'
import type { ICryptoProvider } from '../../utils/crypto/abstract.js'

import type { Logger } from '../../utils/logger.js'
import type { IPacketCodec } from '../transports/index.js'
import { Bytes, read } from '@fuman/io'
import { bigint, typed, u8 } from '@fuman/utils'

const MAX_TLS_PACKET_LENGTH = 2878

// ref: https://github.com/tdlib/td/blob/master/td/mtproto/TlsInit.cpp
const KEY_MOD = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEDn
// 2^255 - 19
const QUAD_RES_MOD = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEDn
// (mod - 1) / 2 = 2^254 - 10
const QUAD_RES_POW = 0x3FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF6n

function _getY2(x: bigint, mod: bigint): bigint {
  // returns y = x^3 + x^2 * 486662 + x
  let y = x
  y = (y + 486662n) % mod
  y = (y * x) % mod
  y = (y + 1n) % mod
  y = (y * x) % mod

  return y
}

function _getDoubleX(x: bigint, mod: bigint): bigint {
  // returns x_2 = (x^2 - 1)^2/(4*y^2)
  let denominator = _getY2(x, mod)
  denominator = (denominator * 4n) % mod

  let numerator = (x * x) % mod
  numerator = (numerator - 1n) % mod
  numerator = (numerator * numerator) % mod

  denominator = bigint.modInv(denominator, mod)
  numerator = (numerator * denominator) % mod

  return numerator
}

function _isQuadraticResidue(a: bigint): boolean {
  const r = bigint.modPowBinary(a, QUAD_RES_POW, QUAD_RES_MOD)

  return r === 1n
}

function executeTlsOperations(h: TlsHelloWriter): void {
  h.string([0x16, 0x03, 0x01, 0x02, 0x00, 0x01, 0x00, 0x01, 0xFC, 0x03, 0x03])
  h.zero(32)
  h.string([0x20])
  h.random(32)
  h.string([0x00, 0x20])
  h.grease(0)
  /* eslint-disable antfu/consistent-list-newline */
  h.string([
    0x13, 0x01, 0x13, 0x02, 0x13, 0x03, 0xC0, 0x2B, 0xC0, 0x2F, 0xC0, 0x2C,
    0xC0, 0x30, 0xCC, 0xA9, 0xCC, 0xA8, 0xC0, 0x13, 0xC0, 0x14, 0x00, 0x9C,
    0x00, 0x9D, 0x00, 0x2F, 0x00, 0x35, 0x01, 0x00, 0x01, 0x93,
  ])
  h.grease(2)
  h.string([0x00, 0x00, 0x00, 0x00])
  h.beginScope()
  h.beginScope()
  h.string([0x00])
  h.beginScope()
  h.domain()
  h.endScope()
  h.endScope()
  h.endScope()
  h.string([0x00, 0x17, 0x00, 0x00, 0xFF, 0x01, 0x00, 0x01, 0x00, 0x00, 0x0A, 0x00, 0x0A, 0x00, 0x08])
  h.grease(4)
  h.string(
    [
      0x00, 0x1D, 0x00, 0x17, 0x00, 0x18, 0x00, 0x0B, 0x00, 0x02, 0x01, 0x00,
      0x00, 0x23, 0x00, 0x00, 0x00, 0x10, 0x00, 0x0E, 0x00, 0x0C, 0x02, 0x68,
      0x32, 0x08, 0x68, 0x74, 0x74, 0x70, 0x2F, 0x31, 0x2E, 0x31, 0x00, 0x05,
      0x00, 0x05, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0D, 0x00, 0x12, 0x00,
      0x10, 0x04, 0x03, 0x08, 0x04, 0x04, 0x01, 0x05, 0x03, 0x08, 0x05, 0x05,
      0x01, 0x08, 0x06, 0x06, 0x01, 0x00, 0x12, 0x00, 0x00, 0x00, 0x33, 0x00,
      0x2B, 0x00, 0x29,
    ],
  )
  h.grease(4)
  h.string([0x00, 0x01, 0x00, 0x00, 0x1D, 0x00, 0x20])
  h.key()
  h.string([0x00, 0x2D, 0x00, 0x02, 0x01, 0x01, 0x00, 0x2B, 0x00, 0x0B, 0x0A])
  h.grease(6)
  h.string([0x03, 0x04, 0x03, 0x03, 0x03, 0x02, 0x03, 0x01, 0x00, 0x1B, 0x00, 0x03, 0x02, 0x00, 0x02])
  h.grease(3)
  h.string([0x00, 0x01, 0x00, 0x00, 0x15])
  /* eslint-enable */
}

function initGrease(crypto: ICryptoProvider, size: number): Uint8Array {
  const buf = crypto.randomBytes(size)

  for (let i = 0; i < size; i++) {
    buf[i] = (buf[i] & 0xF0) + 0x0A
  }

  for (let i = 1; i < size; i += 2) {
    if (buf[i] === buf[i - 1]) {
      buf[i] ^= 0x10
    }
  }

  return buf
}

class TlsHelloWriter {
  buf: Uint8Array
  dv: DataView
  pos = 0

  private _domain: Uint8Array
  private _grease
  private _scopes: number[] = []

  constructor(
    readonly crypto: ICryptoProvider,
    size: number,
    domain: Uint8Array,
  ) {
    this._domain = domain
    this.buf = u8.alloc(size)
    this.dv = typed.toDataView(this.buf)
    this._grease = initGrease(this.crypto, 7)
  }

  string(buf: ArrayLike<number>) {
    this.buf.set(buf, this.pos)
    this.pos += buf.length
  }

  random(size: number) {
    this.string(this.crypto.randomBytes(size))
  }

  zero(size: number) {
    // since the Uint8Array is initialized with zeros, we can just skip
    this.pos += size
  }

  domain() {
    this.string(this._domain)
  }

  grease(seed: number) {
    this.buf[this.pos] = this.buf[this.pos + 1] = this._grease[seed]
    this.pos += 2
  }

  key() {
    for (;;) {
      const key = this.crypto.randomBytes(32)
      key[31] &= 127

      let x = bigint.fromBytes(key)
      const y = _getY2(x, KEY_MOD)

      if (_isQuadraticResidue(y)) {
        for (let i = 0; i < 3; i++) {
          x = _getDoubleX(x, KEY_MOD)
        }

        const key = bigint.toBytes(x, 32, true)
        this.string(key)

        return
      }
    }
  }

  beginScope() {
    this._scopes.push(this.pos)
    this.pos += 2
  }

  endScope() {
    const begin = this._scopes.pop()

    if (begin === undefined) {
      throw new Error('endScope called without beginScope')
    }

    const end = this.pos
    const size = end - begin - 2

    this.dv.setUint16(begin, size)
  }

  async finish(secret: Uint8Array): Promise<Uint8Array> {
    const padSize = 515 - this.pos
    const unixTime = ~~(Date.now() / 1000)

    this.beginScope()
    this.zero(padSize)
    this.endScope()

    const hash = await this.crypto.hmacSha256(this.buf, secret)
    const dv = typed.toDataView(hash)

    const old = dv.getInt32(28, true)
    dv.setInt32(28, old ^ unixTime, true)

    this.buf.set(hash, 11)

    return this.buf
  }
}

export async function generateFakeTlsHeader(
  domain: Uint8Array,
  secret: Uint8Array,
  crypto: ICryptoProvider,
): Promise<Uint8Array> {
  const writer = new TlsHelloWriter(crypto, 517, domain)
  executeTlsOperations(writer)

  return writer.finish(secret)
}

/**
 * Fake TLS packet codec, used for some MTProxies.
 *
 * Must only be used inside {@link MtProxyTcpTransport}
 * @internal
 */
export class FakeTlsPacketCodec implements IPacketCodec {
  // protected _stream: Buffer = Buffer.alloc(0)
  constructor(readonly _inner: IPacketCodec) {}

  private _isFirstTls = true

  setup?(crypto: ICryptoProvider, log: Logger): void {
    this._inner.setup?.(crypto, log)
  }

  private _tag!: Uint8Array
  async tag(): Promise<Uint8Array> {
    this._tag = await this._inner.tag()
    return new Uint8Array(0)
  }

  async encode(packet: Uint8Array, into: ISyncWritable): Promise<void> {
    const tmp = Bytes.alloc(packet.length)
    await this._inner.encode(packet, tmp)

    while (tmp.available > 0) {
      const header = new Uint8Array([0x17, 0x03, 0x03, 0x00, 0x00])

      let packet
      if (this._isFirstTls) {
        this._isFirstTls = false
        packet = u8.concat2(this._tag, tmp.readSync(MAX_TLS_PACKET_LENGTH - this._tag.length))
      } else {
        packet = tmp.readSync(MAX_TLS_PACKET_LENGTH)
      }

      typed.toDataView(header).setUint16(3, packet.length)

      into.writeSync(header.length).set(header)
      into.writeSync(packet.length).set(packet)
      into.disposeWriteSync()
    }
  }

  async decode(reader: Bytes, eof: boolean): Promise<Uint8Array | null> {
    if (eof) return null
    if (reader.available < 5) return null

    const header = reader.readSync(3)
    if (header[0] !== 0x17 || header[1] !== 0x03 || header[2] !== 0x03) {
      throw new Error('Invalid TLS header')
    }

    const length = read.uint16be(reader)
    if (length < reader.available - 5) {
      reader.rewind(5)
      return null
    }

    const packet = reader.readSync(length)
    const inner = await this._inner.decode(Bytes.from(packet), eof)

    if (!inner) {
      reader.rewind(5 + length)
      return null
    }

    return inner
  }

  reset(): void {
    this._isFirstTls = true
  }
}
