import type { ISyncWritable } from '@fuman/io'
import { Bytes, write } from '@fuman/io'

import { bufferToReversed, concatBuffers, dataViewFromBuffer } from '../../utils/buffer-utils.js'
import type { IAesCtr, ICryptoProvider, Logger } from '../../utils/index.js'

import type { IPacketCodec } from './abstract.js'

export interface MtProxyInfo {
    dcId: number
    secret: Uint8Array
    test: boolean
    media: boolean
}

export class ObfuscatedPacketCodec implements IPacketCodec {
    private _encryptor?: IAesCtr
    private _decryptor?: IAesCtr

    private _crypto!: ICryptoProvider
    private _inner: IPacketCodec
    private _proxy?: MtProxyInfo

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this._inner.setup?.(crypto, log)
    }

    constructor(inner: IPacketCodec, proxy?: MtProxyInfo) {
        // super(inner)
        this._inner = inner
        this._proxy = proxy
    }

    async tag(): Promise<Uint8Array> {
        let random: Uint8Array
        let dv: DataView

        for (;;) {
            random = this._crypto.randomBytes(64)
            if (random[0] === 0xEF) continue

            dv = dataViewFromBuffer(random)
            const firstInt = dv.getUint32(0, true)

            if (
                firstInt === 0x44414548 // HEAD
                || firstInt === 0x54534F50 // POST
                || firstInt === 0x20544547 // GET(space)
                || firstInt === 0x4954504F // OPTI
                || firstInt === 0xDDDDDDDD // padded intermediate
                || firstInt === 0xEEEEEEEE // intermediate
                || firstInt === 0x02010316 // no idea, taken from tdlib
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

        const randomRev = bufferToReversed(random, 8, 56)

        let encryptKey = random.subarray(8, 40)
        const encryptIv = random.subarray(40, 56)

        let decryptKey = randomRev.subarray(0, 32)
        const decryptIv = randomRev.subarray(32, 48)

        if (this._proxy) {
            encryptKey = this._crypto.sha256(concatBuffers([encryptKey, this._proxy.secret]))
            decryptKey = this._crypto.sha256(concatBuffers([decryptKey, this._proxy.secret]))
        }

        this._encryptor = this._crypto.createAesCtr(encryptKey, encryptIv, true)
        this._decryptor = this._crypto.createAesCtr(decryptKey, decryptIv, false)

        const encrypted = this._encryptor.process(random)
        random.set(encrypted.subarray(56, 64), 56)

        return random
    }

    async encode(packet: Uint8Array, into: ISyncWritable): Promise<void> {
        const temp = Bytes.alloc(packet.length)
        await this._inner.encode(packet, into)
        write.bytes(into, this._encryptor!.process(temp.result()))
    }

    async decode(reader: Bytes, eof: boolean): Promise<Uint8Array | null> {
        const inner = await this._inner.decode(reader, eof)
        if (!inner) return null

        return this._decryptor!.process(inner)
    }

    reset(): void {
        this._inner.reset()
        this._encryptor?.close?.()
        this._decryptor?.close?.()

        this._encryptor = undefined
        this._decryptor = undefined
    }
}
