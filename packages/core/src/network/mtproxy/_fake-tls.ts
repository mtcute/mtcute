import type { ISyncWritable } from '@fuman/io'
import type { ICryptoProvider } from '../../utils/crypto/abstract.js'

import type { Logger } from '../../utils/logger.js'
import type { IPacketCodec } from '../transports/index.js'
import { Bytes, read } from '@fuman/io'
import { bigint, typed, u8 } from '@fuman/utils'

const MAX_TLS_PACKET_LENGTH = 2878
// modern chrome client hello (with X25519MLKEM768 keyshare) is ~1500-1700 bytes;
// allocate generously and slice to the actual length afterwards
const MAX_TLS_HELLO_SIZE = 4096

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

/* eslint-disable antfu/consistent-list-newline */
function executeTlsOperations(h: TlsHelloWriter): void {
  h.string([0x16, 0x03, 0x01])
  h.beginScope() // record length
  h.string([0x01, 0x00]) // handshake type (client hello) + high byte of 24-bit length
  h.beginScope() // handshake length (low 16 bits)
  h.string([0x03, 0x03]) // client version
  h.zero(32) // digest slot (hmac written here, at offset 11)
  h.string([0x20])
  h.random(32) // session id
  h.string([0x00, 0x20])
  h.grease(0)
  h.string([
    0x13, 0x01, 0x13, 0x02, 0x13, 0x03, 0xC0, 0x2B, 0xC0, 0x2F, 0xC0, 0x2C,
    0xC0, 0x30, 0xCC, 0xA9, 0xCC, 0xA8, 0xC0, 0x13, 0xC0, 0x14, 0x00, 0x9C,
    0x00, 0x9D, 0x00, 0x2F, 0x00, 0x35, 0x01, 0x00,
  ]) // cipher suites + compression methods (null)
  h.beginScope() // extensions length
  h.grease(2)
  h.string([0x00, 0x00])
  h.permutation([
    (w) => { // server_name (SNI)
      w.string([0x00, 0x00])
      w.beginScope()
      w.beginScope()
      w.string([0x00])
      w.beginScope()
      w.domain()
      w.endScope()
      w.endScope()
      w.endScope()
    },
    w => w.string([0x00, 0x05, 0x00, 0x05, 0x01, 0x00, 0x00, 0x00, 0x00]), // status_request
    (w) => { // supported_groups
      w.string([0x00, 0x0A, 0x00, 0x0C, 0x00, 0x0A])
      w.grease(4)
      w.string([0x11, 0xEC, 0x00, 0x1D, 0x00, 0x17, 0x00, 0x18])
    },
    w => w.string([0x00, 0x0B, 0x00, 0x02, 0x01, 0x00]), // ec_point_formats
    w => w.string([ // signature_algorithms
      0x00, 0x0D, 0x00, 0x12, 0x00, 0x10, 0x04, 0x03, 0x08, 0x04, 0x04, 0x01,
      0x05, 0x03, 0x08, 0x05, 0x05, 0x01, 0x08, 0x06, 0x06, 0x01,
    ]),
    w => w.string([ // application_layer_protocol_negotiation (ALPN)
      0x00, 0x10, 0x00, 0x0E, 0x00, 0x0C, 0x02, 0x68, 0x32, 0x08, 0x68, 0x74,
      0x74, 0x70, 0x2F, 0x31, 0x2E, 0x31,
    ]),
    w => w.string([0x00, 0x12, 0x00, 0x00]), // signed_certificate_timestamp
    w => w.string([0x00, 0x17, 0x00, 0x00]), // extended_master_secret
    w => w.string([0x00, 0x1B, 0x00, 0x03, 0x02, 0x00, 0x02]), // compress_certificate
    w => w.string([0x00, 0x23, 0x00, 0x00]), // session_ticket
    (w) => { // supported_versions
      w.string([0x00, 0x2B, 0x00, 0x07, 0x06])
      w.grease(6)
      w.string([0x03, 0x04, 0x03, 0x03])
    },
    w => w.string([0x00, 0x2D, 0x00, 0x02, 0x01, 0x01]), // psk_key_exchange_modes
    (w) => { // key_share
      w.string([0x00, 0x33, 0x04, 0xEF, 0x04, 0xED])
      w.grease(4)
      w.string([0x00, 0x01, 0x00, 0x11, 0xEC, 0x04, 0xC0])
      w.mlKem768Key()
      w.key()
      w.string([0x00, 0x1D, 0x00, 0x20])
      w.key()
    },
    w => w.string([0x44, 0xCD, 0x00, 0x05, 0x00, 0x03, 0x02, 0x68, 0x32]), // application_settings (ALPS)
    (w) => { // encrypted_client_hello (GREASE)
      w.string([0xFE, 0x0D])
      w.beginScope()
      w.string([0x00, 0x00, 0x01, 0x00, 0x01])
      w.random(1)
      w.string([0x00, 0x20])
      w.random(32)
      w.beginScope()
      w.echPayload()
      w.endScope()
      w.endScope()
    },
    w => w.string([0xFF, 0x01, 0x00, 0x01, 0x00]), // renegotiation_info
  ])
  h.grease(3)
  h.string([0x00, 0x01, 0x00])
  h.padding()
  h.endScope() // extensions
  h.endScope() // handshake
  h.endScope() // record
}
/* eslint-enable antfu/consistent-list-newline */

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
  private _grease: Uint8Array
  private _scopes: number[] = []

  constructor(
    readonly crypto: ICryptoProvider,
    domain: Uint8Array,
    grease?: Uint8Array,
  ) {
    this._domain = domain
    this.buf = u8.alloc(MAX_TLS_HELLO_SIZE)
    this.dv = typed.toDataView(this.buf)
    // shared across permutation sub-writers so grease seeds stay consistent
    this._grease = grease ?? initGrease(this.crypto, 7)
  }

  string(buf: ArrayLike<number>): void {
    this.buf.set(buf, this.pos)
    this.pos += buf.length
  }

  random(size: number): void {
    this.string(this.crypto.randomBytes(size))
  }

  zero(size: number): void {
    // since the Uint8Array is initialized with zeros, we can just skip
    this.pos += size
  }

  domain(): void {
    this.string(this._domain)
  }

  grease(seed: number): void {
    this.buf[this.pos] = this.buf[this.pos + 1] = this._grease[seed]
    this.pos += 2
  }

  key(): void {
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

  // fake X25519MLKEM768 hybrid keyshare's ml-kem-768 part: 384 coefficients
  // (mod 3329) packed 3 bytes per 2 coefficients, followed by 32 random bytes
  mlKem768Key(): void {
    const rnd = this.crypto.randomBytes(384 * 8)
    const dv = typed.toDataView(rnd)

    for (let i = 0; i < 384; i++) {
      const a = dv.getUint32(i * 8, true) % 3329
      const b = dv.getUint32(i * 8 + 4, true) % 3329
      this.buf[this.pos++] = a & 0xFF
      this.buf[this.pos++] = (a >> 8) + ((b & 0x0F) << 4)
      this.buf[this.pos++] = b >> 4
    }

    this.random(32)
  }

  // GREASE ECH payload: random bytes of length 144/176/208/240
  echPayload(): void {
    this.random(this._randomInt(4) * 32 + 144)
  }

  beginScope(): void {
    this._scopes.push(this.pos)
    this.pos += 2
  }

  endScope(): void {
    const begin = this._scopes.pop()

    if (begin === undefined) {
      throw new Error('endScope called without beginScope')
    }

    this.dv.setUint16(begin, this.pos - begin - 2)
  }

  // render each part into its own buffer, then emit them in random order —
  // mimics chrome's per-connection tls extension shuffling
  permutation(parts: Array<(w: TlsHelloWriter) => void>): void {
    const rendered = parts.map((fn) => {
      const sub = new TlsHelloWriter(this.crypto, this._domain, this._grease)
      fn(sub)
      return sub.buf.subarray(0, sub.pos)
    })

    for (let i = rendered.length - 1; i > 0; i--) {
      const j = this._randomInt(i + 1)
      const tmp = rendered[i]
      rendered[i] = rendered[j]
      rendered[j] = tmp
    }

    for (const part of rendered) {
      this.string(part)
    }
  }

  // tls padding extension, only emitted for hellos smaller than 513 bytes
  padding(): void {
    if (this.pos >= 513) return

    const size = 513 - this.pos
    this.string([0x00, 0x15])
    this.beginScope()
    this.zero(size)
    this.endScope()
  }

  private _randomInt(max: number): number {
    return typed.toDataView(this.crypto.randomBytes(4)).getUint32(0, true) % max
  }

  async finish(secret: Uint8Array): Promise<Uint8Array> {
    const data = this.buf.subarray(0, this.pos)
    const unixTime = ~~(Date.now() / 1000)

    const hash = await this.crypto.hmacSha256(data, secret)
    const dv = typed.toDataView(hash)

    const old = dv.getInt32(28, true)
    dv.setInt32(28, old ^ unixTime, true)

    data.set(hash, 11)

    return data
  }
}

export async function generateFakeTlsHeader(
  domain: Uint8Array,
  secret: Uint8Array,
  crypto: ICryptoProvider,
): Promise<Uint8Array> {
  const writer = new TlsHelloWriter(crypto, domain)
  executeTlsOperations(writer)

  return writer.finish(secret)
}

const EMPTY_BYTES = Bytes.from(u8.empty)

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

    // a single inner frame can be sliced across multiple TLS records.
    // we need to feed as much as possible into the inner codec until it actually yields a frame.
    // a bit of an abstraction leak, relying on the inner codec to be stateful, but whatever.
    while (reader.available >= 5) {
      const header = reader.readSync(3)
      if (header[0] !== 0x17 || header[1] !== 0x03 || header[2] !== 0x03) {
        throw new Error('Invalid TLS header')
      }

      const length = read.uint16be(reader)
      if (reader.available < length) {
        // incomplete trailing record - wait for more data
        reader.rewind(5)
        break
      }

      const inner = await this._inner.decode(Bytes.from(reader.readSync(length)), eof)
      if (inner) return inner
    }

    // try draining the inner codec
    return this._inner.decode(EMPTY_BYTES, eof)
  }

  reset(): void {
    this._isFirstTls = true
  }
}
