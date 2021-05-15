import { PacketCodec } from './abstract'
import { ICryptoProvider, IEncryptionScheme } from '../../utils/crypto'
import { EventEmitter } from 'events'
import {
    buffersEqual,
    randomBytes,
} from '../../utils/buffer-utils'
import { WebSocketTransport } from './websocket'
import { IntermediatePacketCodec } from './tcp-intermediate'

// initial payload can't start with these
const BAD_HEADERS = [
    Buffer.from('GET', 'utf8'),
    Buffer.from('POST', 'utf8'),
    Buffer.from('HEAD', 'utf8'),
    Buffer.from('PVrG', 'utf8'),
    Buffer.from('eeeeeeee', 'hex'),
]

export class ObfuscatedPacketCodec extends EventEmitter implements PacketCodec {
    private _inner: PacketCodec
    private _crypto: ICryptoProvider
    private _encryptor?: IEncryptionScheme
    private _decryptor?: IEncryptionScheme

    constructor(inner: PacketCodec) {
        super()
        this._inner = inner
        this._inner.on('error', (err) => this.emit('error', err))
        this._inner.on('packet', (buf) => this.emit('packet', buf))
    }

    setupCrypto(crypto: ICryptoProvider): void {
        this._crypto = crypto
    }

    async tag(): Promise<Buffer> {
        let random: Buffer
        r: for (;;) {
            random = randomBytes(64)
            if (random[0] === 0xef) continue
            for (const h of BAD_HEADERS) {
                if (buffersEqual(random.slice(0, h.length), h)) continue r
            }
            if (random.readUInt32LE(4) === 0) continue

            break
        }

        let innerTag = await this._inner.tag()
        if (innerTag.length !== 4) {
            const b = innerTag[0]
            innerTag = Buffer.from([b, b, b, b])
        }
        innerTag.copy(random, 56)

        const randomRev = Buffer.from(random.slice(8, 56)).reverse()

        const encryptKey = random.slice(8, 40)
        const encryptIv = random.slice(40, 56)

        const decryptKey = randomRev.slice(0, 32)
        const decryptIv = randomRev.slice(32, 48)

        this._encryptor = this._crypto.createAesCtr(encryptKey, encryptIv, true)
        this._decryptor = this._crypto.createAesCtr(decryptKey, decryptIv, false)

        const encrypted = await this._encryptor.encrypt(random)
        encrypted.copy(random, 56, 56, 64)

        return random
    }

    async encode(packet: Buffer): Promise<Buffer> {
        return this._encryptor!.encrypt(await this._inner.encode(packet))
    }

    feed(data: Buffer): void {
        const dec = this._decryptor!.decrypt(data)
        if (dec.constructor === Buffer) this._inner.feed(dec)
        else (dec as Promise<Buffer>).then((dec) => this._inner.feed(dec))
    }

    reset(): void {
        this._inner.reset()
        delete this._encryptor
        delete this._decryptor
    }
}

export class WebSocketObfuscatedTransport extends WebSocketTransport {
    _packetCodec = new ObfuscatedPacketCodec(new IntermediatePacketCodec())
}
