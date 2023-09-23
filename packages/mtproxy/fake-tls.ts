import bigInt, { BigInteger } from 'big-integer'

import { IPacketCodec, WrappedCodec } from '@mtcute/core'
import { bigIntToBuffer, bufferToBigInt, ICryptoProvider, randomBytes } from '@mtcute/core/utils'

const MAX_TLS_PACKET_LENGTH = 2878
const TLS_FIRST_PREFIX = Buffer.from('140303000101', 'hex')

// ref: https://github.com/tdlib/td/blob/master/td/mtproto/TlsInit.cpp
const KEY_MOD = bigInt('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed', 16)
// 2^255 - 19
const QUAD_RES_MOD = bigInt('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed', 16)
// (mod - 1) / 2 = 2^254 - 10
const QUAD_RES_POW = bigInt('3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6', 16)

function _getY2(x: BigInteger, mod: BigInteger): BigInteger {
    // returns y = x^3 + x^2 * 486662 + x
    let y = x
    y = y.add(486662).mod(mod)
    y = y.multiply(x).mod(mod)
    y = y.plus(1).mod(mod)
    y = y.multiply(x).mod(mod)

    return y
}

function _getDoubleX(x: BigInteger, mod: BigInteger): BigInteger {
    // returns x_2 = (x^2 - 1)^2/(4*y^2)
    let denominator = _getY2(x, mod)
    denominator = denominator.multiply(4).mod(mod)

    let numerator = x.multiply(x).mod(mod)
    numerator = numerator.minus(1).mod(mod)
    numerator = numerator.multiply(numerator).mod(mod)

    denominator = denominator.modInv(mod)
    numerator = numerator.multiply(denominator).mod(mod)

    return numerator
}

function _isQuadraticResidue(a: BigInteger): boolean {
    const r = a.modPow(QUAD_RES_POW, QUAD_RES_MOD)

    return r.eq(1)
}

interface TlsOperationHandler {
    string(buf: Buffer): void
    zero(size: number): void
    random(size: number): void
    domain(): void
    grease(seed: number): void
    beginScope(): void
    endScope(): void
    key(): void
}

function executeTlsOperations(h: TlsOperationHandler): void {
    h.string(Buffer.from('1603010200010001fc0303', 'hex'))
    h.zero(32)
    h.string(Buffer.from('20', 'hex'))
    h.random(32)
    h.string(Buffer.from('0020', 'hex'))
    h.grease(0)
    h.string(Buffer.from('130113021303c02bc02fc02cc030cca9cca8c013c014009c009d002f003501000193', 'hex'))
    h.grease(2)
    h.string(Buffer.from('00000000', 'hex'))
    h.beginScope()
    h.beginScope()
    h.string(Buffer.from('00', 'hex'))
    h.beginScope()
    h.domain()
    h.endScope()
    h.endScope()
    h.endScope()
    h.string(Buffer.from('00170000ff01000100000a000a0008', 'hex'))
    h.grease(4)
    h.string(
        Buffer.from(
            '001d00170018000b00020100002300000010000e000c02683208687474702f312e31000500050100000000000d0012001004030804040105030805050108060601001200000033002b0029',
            'hex',
        ),
    )
    h.grease(4)
    h.string(Buffer.from('000100001d0020', 'hex'))
    h.key()
    h.string(Buffer.from('002d00020101002b000b0a', 'hex'))
    h.grease(6)
    h.string(Buffer.from('0304030303020301001b0003020002', 'hex'))
    h.grease(3)
    h.string(Buffer.from('0001000015', 'hex'))
}

// i dont know why is this needed, since it is always padded to 517 bytes
// this was in tdlib sources, so whatever. not used here though, and works just fine
// class TlsHelloCounter implements TlsOperationHandler {
//     size = 0
//
//     private _domain: Buffer
//
//     constructor(domain: Buffer) {
//         this._domain = domain
//     }
//
//     string(buf: Buffer) {
//         this.size += buf.length
//     }
//
//     random(size: number) {
//         this.size += size
//     }
//
//     zero(size: number) {
//         this.size += size
//     }
//
//     domain() {
//         this.size += this._domain.length
//     }
//
//     grease() {
//         this.size += 2
//     }
//
//     key() {
//         this.size += 32
//     }
//
//     beginScope() {
//         this.size += 2
//     }
//
//     endScope() {
//         // no-op, since this does not affect size
//     }
//
//     finish(): number {
//         const zeroPad = 515 - this.size
//         this.beginScope()
//         this.zero(zeroPad)
//         this.endScope()
//
//         return this.size
//     }
// }

function initGrease(size: number): Buffer {
    const buf = randomBytes(size)

    for (let i = 0; i < size; i++) {
        buf[i] = (buf[i] & 0xf0) + 0x0a
    }

    for (let i = 1; i < size; i += 2) {
        if (buf[i] === buf[i - 1]) {
            buf[i] ^= 0x10
        }
    }

    return buf
}

class TlsHelloWriter implements TlsOperationHandler {
    buf: Buffer
    pos = 0

    private _domain: Buffer
    private _grease = initGrease(7)
    private _scopes: number[] = []

    constructor(size: number, domain: Buffer) {
        this._domain = domain
        this.buf = Buffer.allocUnsafe(size)
    }

    string(buf: Buffer) {
        buf.copy(this.buf, this.pos)
        this.pos += buf.length
    }

    random(size: number) {
        this.string(randomBytes(size))
    }

    zero(size: number) {
        this.string(Buffer.alloc(size, 0))
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
            const key = randomBytes(32)
            key[31] &= 127

            let x = bufferToBigInt(key)
            const y = _getY2(x, KEY_MOD)

            if (_isQuadraticResidue(y)) {
                for (let i = 0; i < 3; i++) {
                    x = _getDoubleX(x, KEY_MOD)
                }

                const key = bigIntToBuffer(x, 32, true)
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

        this.buf.writeUInt16BE(size, begin)
    }

    async finish(secret: Buffer, crypto: ICryptoProvider): Promise<Buffer> {
        const padSize = 515 - this.pos
        const unixTime = ~~(Date.now() / 1000)

        this.beginScope()
        this.zero(padSize)
        this.endScope()

        const hash = await crypto.hmacSha256(this.buf, secret)

        const old = hash.readInt32LE(28)
        hash.writeInt32LE(old ^ unixTime, 28)

        hash.copy(this.buf, 11)

        return this.buf
    }
}

/** @internal */
export async function generateFakeTlsHeader(domain: string, secret: Buffer, crypto: ICryptoProvider): Promise<Buffer> {
    const domainBuf = Buffer.from(domain)

    const writer = new TlsHelloWriter(517, domainBuf)
    executeTlsOperations(writer)

    return writer.finish(secret, crypto)
}

/**
 * Fake TLS packet codec, used for some MTProxies.
 *
 * Must only be used inside {@link MtProxyTcpTransport}
 * @internal
 */
export class FakeTlsPacketCodec extends WrappedCodec implements IPacketCodec {
    protected _stream = Buffer.alloc(0)

    private _header!: Buffer
    private _isFirstTls = true

    async tag(): Promise<Buffer> {
        this._header = await this._inner.tag()

        return Buffer.alloc(0)
    }

    private _encodeTls(packet: Buffer): Buffer {
        if (this._header.length) {
            packet = Buffer.concat([this._header, packet])
            this._header = Buffer.alloc(0)
        }

        const header = Buffer.from([0x17, 0x03, 0x03, 0x00, 0x00])
        header.writeUInt16BE(packet.length, 3)

        if (this._isFirstTls) {
            this._isFirstTls = false

            return Buffer.concat([TLS_FIRST_PREFIX, header, packet])
        }

        return Buffer.concat([header, packet])
    }

    async encode(packet: Buffer): Promise<Buffer> {
        packet = await this._inner.encode(packet)

        if (packet.length + this._header.length > MAX_TLS_PACKET_LENGTH) {
            const ret: Buffer[] = []

            while (packet.length) {
                const buf = packet.slice(0, MAX_TLS_PACKET_LENGTH - this._header.length)
                packet = packet.slice(buf.length)
                ret.push(this._encodeTls(buf))
            }

            return Buffer.concat(ret)
        }

        return this._encodeTls(packet)
    }

    feed(data: Buffer): void {
        this._stream = Buffer.concat([this._stream, data])

        for (;;) {
            if (this._stream.length < 5) return

            if (!(this._stream[0] === 0x17 && this._stream[1] === 0x03 && this._stream[2] === 0x03)) {
                this.emit('error', new Error('Invalid TLS header'))

                return
            }

            const length = this._stream.readUInt16BE(3)
            if (length < this._stream.length - 5) return

            this._inner.feed(this._stream.slice(5, length + 5))
            this._stream = this._stream.slice(length + 5)
        }
    }

    reset(): void {
        this._stream = Buffer.alloc(0)
        this._isFirstTls = true
    }
}
