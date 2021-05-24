import { PacketCodec } from './abstract'
import { ICryptoProvider, IEncryptionScheme } from '../../utils/crypto'
import { EventEmitter } from 'events'
import { buffersEqual, randomBytes } from '../../utils/buffer-utils'
import { WrappedCodec } from './wrapped'

// initial payload can't start with these
const BAD_HEADERS = [
    Buffer.from('GET', 'utf8'),
    Buffer.from('POST', 'utf8'),
    Buffer.from('HEAD', 'utf8'),
    Buffer.from('PVrG', 'utf8'),
    Buffer.from('eeeeeeee', 'hex'),
]

interface MtProxyInfo {
    dcId: number
    secret: Buffer
    test: boolean
    media: boolean
}

export class ObfuscatedPacketCodec extends WrappedCodec implements PacketCodec {
    private _encryptor?: IEncryptionScheme
    private _decryptor?: IEncryptionScheme

    private _proxy?: MtProxyInfo

    constructor(inner: PacketCodec, proxy?: MtProxyInfo) {
        super(inner)
        this._proxy = proxy
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

        if (this._proxy) {
            let dcId = this._proxy.dcId
            if (this._proxy.test) dcId += 10000
            if (this._proxy.media) dcId = -dcId

            random.writeInt16LE(dcId, 60)
        }

        const randomRev = Buffer.from(random.slice(8, 56)).reverse()

        let encryptKey = random.slice(8, 40)
        const encryptIv = random.slice(40, 56)

        let decryptKey = randomRev.slice(0, 32)
        const decryptIv = randomRev.slice(32, 48)

        if (this._proxy) {
            encryptKey = await this._crypto.sha256(
                Buffer.concat([encryptKey, this._proxy.secret])
            )
            decryptKey = await this._crypto.sha256(
                Buffer.concat([decryptKey, this._proxy.secret])
            )
        }

        this._encryptor = this._crypto.createAesCtr(encryptKey, encryptIv, true)
        this._decryptor = this._crypto.createAesCtr(
            decryptKey,
            decryptIv,
            false
        )

        const encrypted = await this._encryptor.encrypt(random)
        encrypted.copy(random, 56, 56, 64)

        return random
    }

    async encode(packet: Buffer): Promise<Buffer> {
        return this._encryptor!.encrypt(await this._inner.encode(packet))
    }

    feed(data: Buffer): void {
        const dec = this._decryptor!.decrypt(data)
        if (Buffer.isBuffer(dec)) this._inner.feed(dec)
        else dec.then((dec) => this._inner.feed(dec))
    }

    reset(): void {
        this._inner.reset()
        delete this._encryptor
        delete this._decryptor
    }
}
