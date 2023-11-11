import Long from 'long'

import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlReaderMap } from '@mtcute/tl-runtime'

import { MtcuteError } from '../types/errors.js'
import { createAesIgeForMessage } from '../utils/crypto/mtproto.js'
import { buffersEqual, concatBuffers, dataViewFromBuffer, ICryptoProvider, Logger } from '../utils/index.js'

export class AuthKey {
    ready = false

    key!: Uint8Array
    id!: Uint8Array
    clientSalt!: Uint8Array
    serverSalt!: Uint8Array

    constructor(
        readonly _crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap,
    ) {}

    match(keyId: Uint8Array): boolean {
        return this.ready && buffersEqual(keyId, this.id)
    }

    setup(authKey?: Uint8Array | null): void {
        if (!authKey) return this.reset()

        this.ready = true
        this.key = authKey
        this.clientSalt = authKey.subarray(88, 120)
        this.serverSalt = authKey.subarray(96, 128)
        this.id = this._crypto.sha1(authKey).subarray(-8)

        this.log.verbose('auth key set up, id = %h', this.id)
    }

    encryptMessage(message: Uint8Array, serverSalt: Long, sessionId: Long): Uint8Array {
        if (!this.ready) throw new MtcuteError('Keys are not set up!')

        let padding = (16 /* header size */ + message.length + 12) /* min padding */ % 16
        padding = 12 + (padding ? 16 - padding : 0)

        const buf = new Uint8Array(16 + message.length + padding)
        const dv = dataViewFromBuffer(buf)

        dv.setInt32(0, serverSalt.low, true)
        dv.setInt32(4, serverSalt.high, true)
        dv.setInt32(8, sessionId.low, true)
        dv.setInt32(12, sessionId.high, true)
        buf.set(message, 16)
        this._crypto.randomFill(buf.subarray(16 + message.length, 16 + message.length + padding))

        const messageKey = this._crypto.sha256(concatBuffers([this.clientSalt, buf])).subarray(8, 24)
        const ige = createAesIgeForMessage(this._crypto, this.key, messageKey, true)
        const encryptedData = ige.encrypt(buf)

        return concatBuffers([this.id, messageKey, encryptedData])
    }

    decryptMessage(
        data: Uint8Array,
        sessionId: Long,
        callback: (msgId: tl.Long, seqNo: number, data: TlBinaryReader) => void,
    ): void {
        const messageKey = data.subarray(8, 24)
        let encryptedData = data.subarray(24)

        const mod16 = encryptedData.byteLength % 16

        if (mod16 !== 0) {
            // strip padding in case of padded transport.
            // i wish this could be done at transport level, but we can't properly align anything there
            // because padding size is not known, and transport level should not be aware of MTProto structure
            encryptedData = encryptedData.subarray(0, encryptedData.byteLength - mod16)
        }

        const ige = createAesIgeForMessage(this._crypto, this.key, messageKey, false)
        const innerData = ige.decrypt(encryptedData)

        const msgKeySource = this._crypto.sha256(concatBuffers([this.serverSalt, innerData]))
        const expectedMessageKey = msgKeySource.subarray(8, 24)

        if (!buffersEqual(messageKey, expectedMessageKey)) {
            this.log.warn('received message with invalid messageKey = %h (expected %h)', messageKey, expectedMessageKey)

            return
        }

        const innerReader = new TlBinaryReader(this._readerMap, innerData)
        innerReader.seek(8) // skip salt
        const sessionId_ = innerReader.long()
        const messageId = innerReader.long(true)

        if (sessionId_.neq(sessionId)) {
            this.log.warn('ignoring message with invalid sessionId = %h', sessionId_)

            return
        }

        const seqNo = innerReader.uint()
        const length = innerReader.uint()

        if (length > innerData.length - 32 /* header size */) {
            this.log.warn('ignoring message with invalid length: %d > %d', length, innerData.length - 32)

            return
        }

        if (length % 4 !== 0) {
            this.log.warn('ignoring message with invalid length: %d is not a multiple of 4', length)

            return
        }

        const paddingSize = innerData.length - length - 32 // header size

        if (paddingSize < 12 || paddingSize > 1024) {
            this.log.warn('ignoring message with invalid padding size: %d', paddingSize)

            return
        }

        callback(messageId, seqNo, innerReader)
    }

    copyFrom(authKey: AuthKey): void {
        this.ready = authKey.ready
        this.key = authKey.key
        this.id = authKey.id
        this.serverSalt = authKey.serverSalt
        this.clientSalt = authKey.clientSalt
    }

    reset(): void {
        this.ready = false
    }
}
