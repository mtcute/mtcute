import { TlBinaryReader, TlReaderMap } from '@mtcute/tl-runtime'
import { buffersEqual, ICryptoProvider, Logger, randomBytes } from '../utils'
import Long from 'long'
import { createAesIgeForMessage } from '../utils/crypto/mtproto'
import { tl } from '@mtcute/tl'

export class AuthKey {
    ready = false

    key!: Buffer
    id!: Buffer
    clientSalt!: Buffer
    serverSalt!: Buffer

    constructor(
        readonly _crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap
    ) {}

    match(keyId: Buffer): boolean {
        return this.ready && buffersEqual(keyId, this.id)
    }

    async setup(authKey?: Buffer | null): Promise<void> {
        if (!authKey) return this.reset()

        this.ready = true
        this.key = authKey
        this.clientSalt = authKey.slice(88, 120)
        this.serverSalt = authKey.slice(96, 128)
        this.id = (await this._crypto.sha1(authKey)).slice(-8)
    }

    async encryptMessage(
        message: Buffer,
        serverSalt: Long,
        sessionId: Long
    ): Promise<Buffer> {
        if (!this.ready) throw new Error('Keys are not set up!')

        let padding =
            (16 /* header size */ + message.length + 12) /* min padding */ % 16
        padding = 12 + (padding ? 16 - padding : 0)

        const buf = Buffer.alloc(16 + message.length + padding)

        buf.writeInt32LE(serverSalt.low)
        buf.writeInt32LE(serverSalt.high, 4)
        buf.writeInt32LE(sessionId.low, 8)
        buf.writeInt32LE(sessionId.high, 12)
        message.copy(buf, 16)
        randomBytes(padding).copy(buf, 16 + message.length)

        const messageKey = (
            await this._crypto.sha256(Buffer.concat([this.clientSalt, buf]))
        ).slice(8, 24)
        const ige = await createAesIgeForMessage(
            this._crypto,
            this.key,
            messageKey,
            true
        )
        const encryptedData = await ige.encrypt(buf)

        return Buffer.concat([this.id, messageKey, encryptedData])
    }

    async decryptMessage(
        data: Buffer,
        sessionId: Long,
        callback: (msgId: tl.Long, seqNo: number, data: TlBinaryReader) => void
    ): Promise<void> {
        const messageKey = data.slice(8, 24)
        const encryptedData = data.slice(24)

        const ige = await createAesIgeForMessage(
            this._crypto,
            this.key,
            messageKey,
            false
        )
        const innerData = await ige.decrypt(encryptedData)

        const expectedMessageKey = (
            await this._crypto.sha256(
                Buffer.concat([this.serverSalt, innerData])
            )
        ).slice(8, 24)

        if (!buffersEqual(messageKey, expectedMessageKey)) {
            this.log.warn(
                '[%h] received message with invalid messageKey = %h (expected %h)',
                messageKey,
                expectedMessageKey
            )
            return
        }

        const innerReader = new TlBinaryReader(this._readerMap, innerData)
        innerReader.seek(8) // skip salt
        const sessionId_ = innerReader.long()
        const messageId = innerReader.long(true)

        if (sessionId_.neq(sessionId)) {
            this.log.warn(
                'ignoring message with invalid sessionId = %h',
                sessionId_
            )
            return
        }

        const seqNo = innerReader.uint()
        const length = innerReader.uint()

        if (length > innerData.length - 32 /* header size */) {
            this.log.warn(
                'ignoring message with invalid length: %d > %d',
                length,
                innerData.length - 32
            )
            return
        }

        if (length % 4 !== 0) {
            this.log.warn(
                'ignoring message with invalid length: %d is not a multiple of 4',
                length
            )
            return
        }

        const paddingSize = innerData.length - length - 32 // header size

        if (paddingSize < 12 || paddingSize > 1024) {
            this.log.warn(
                'ignoring message with invalid padding size: %d',
                paddingSize
            )
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
