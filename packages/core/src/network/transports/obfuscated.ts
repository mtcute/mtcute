import { concatBuffers, dataViewFromBuffer } from '../../utils/buffer-utils.js'
import { IEncryptionScheme, randomBytes } from '../../utils/index.js'
import { IPacketCodec } from './abstract.js'
import { WrappedCodec } from './wrapped.js'

export interface MtProxyInfo {
    dcId: number
    secret: Uint8Array
    test: boolean
    media: boolean
}

export class ObfuscatedPacketCodec extends WrappedCodec implements IPacketCodec {
    private _encryptor?: IEncryptionScheme
    private _decryptor?: IEncryptionScheme

    private _proxy?: MtProxyInfo

    constructor(inner: IPacketCodec, proxy?: MtProxyInfo) {
        super(inner)
        this._proxy = proxy
    }

    async tag(): Promise<Uint8Array> {
        let random: Uint8Array
        let dv: DataView

        for (;;) {
            random = randomBytes(64)
            if (random[0] === 0xef) continue

            dv = dataViewFromBuffer(random)
            const firstInt = dv.getInt32(0, true)

            if (
                firstInt === 0x44414548 || // HEAD
                firstInt === 0x54534f50 || // POST
                firstInt === 0x20544547 || // GET(space)
                firstInt === 0x4954504f || // OPTI
                firstInt === 0xdddddddd || // padded intermediate
                firstInt === 0xeeeeeeee || // intermediate
                firstInt === 0x02010316 // no idea, taken from tdlib
            ) {
                continue
            }
            if (dv.getInt32(4, true) === 0) continue

            break
        }

        let innerTag = await this._inner.tag()

        if (innerTag.length !== 4) {
            const b = innerTag[0]
            innerTag = new Uint8Array([b, b, b, b])
        }
        random.set(innerTag, 56)

        if (this._proxy) {
            let dcId = this._proxy.dcId
            if (this._proxy.test) dcId += 10000
            if (this._proxy.media) dcId = -dcId

            dv.setInt16(60, dcId, true)
        }

        // randomBytes may return a Buffer in Node.js, whose .slice() doesn't copy
        const randomRev = Uint8Array.prototype.slice.call(random, 8, 56).reverse()

        let encryptKey = random.subarray(8, 40)
        const encryptIv = random.subarray(40, 56)

        let decryptKey = randomRev.subarray(0, 32)
        const decryptIv = randomRev.subarray(32, 48)

        if (this._proxy) {
            encryptKey = await this._crypto.sha256(concatBuffers([encryptKey, this._proxy.secret]))
            decryptKey = await this._crypto.sha256(concatBuffers([decryptKey, this._proxy.secret]))
        }

        this._encryptor = await this._crypto.createAesCtr(encryptKey, encryptIv, true)
        this._decryptor = await this._crypto.createAesCtr(decryptKey, decryptIv, false)

        const encrypted = await this._encryptor.encrypt(random)
        random.set(encrypted.subarray(56, 64), 56)

        return random
    }

    async encode(packet: Uint8Array): Promise<Uint8Array> {
        return this._encryptor!.encrypt(await this._inner.encode(packet))
    }

    feed(data: Uint8Array): void {
        const dec = this._decryptor!.decrypt(data)

        if (ArrayBuffer.isView(dec)) this._inner.feed(dec)
        else {
            dec.then((dec) => this._inner.feed(dec)).catch((err) => this.emit('error', err))
        }
    }

    reset(): void {
        this._inner.reset()
        delete this._encryptor
        delete this._decryptor
    }
}
