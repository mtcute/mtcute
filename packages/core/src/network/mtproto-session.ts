import { BigInteger } from 'big-integer'
import { buffersEqual, randomBytes } from '../utils/buffer-utils'
import { ICryptoProvider } from '../utils/crypto'
import { tl } from '@mtcute/tl'
import { createAesIgeForMessage } from '../utils/crypto/mtproto'
import {
    BinaryWriter,
    SerializationCounter,
} from '../utils/binary/binary-writer'
import { BinaryReader } from '../utils/binary/binary-reader'

const debug = require('debug')('mtcute:sess')

export interface EncryptedMessage {
    messageId: BigInteger
    seqNo: number
    content: tl.TlObject
}

/**
 * Class encapsulating a single MTProto session.
 * Provides means to en-/decrypt messages
 */
export class MtprotoSession {
    readonly _crypto: ICryptoProvider

    _sessionId = randomBytes(8)

    _authKey?: Buffer
    _authKeyId?: Buffer
    _authKeyClientSalt?: Buffer
    _authKeyServerSalt?: Buffer

    // default salt: [0x00]*8
    serverSalt: Buffer = Buffer.alloc(8)

    constructor(crypto: ICryptoProvider) {
        this._crypto = crypto
    }

    /** Whether session contains authKey */
    get authorized(): boolean {
        return this._authKey !== undefined
    }

    /** Setup keys based on authKey */
    async setupKeys(authKey: Buffer): Promise<void> {
        this._authKey = authKey
        this._authKeyClientSalt = authKey.slice(88, 120)
        this._authKeyServerSalt = authKey.slice(96, 128)
        this._authKeyId = (await this._crypto.sha1(this._authKey)).slice(-8)
    }

    /** Reset session by removing authKey and values derived from it */
    reset(): void {
        this._authKey = undefined
        this._authKeyClientSalt = undefined
        this._authKeyServerSalt = undefined
        this._authKeyId = undefined
        this._sessionId = randomBytes(8)
        // no need to reset server salt
    }

    /** Encrypt a single MTProto message using session's keys */
    async encryptMessage(
        message: tl.TlObject | Buffer,
        messageId: BigInteger,
        seqNo: number
    ): Promise<Buffer> {
        if (!this._authKey) throw new Error('Keys are not set up!')

        const length =
            Buffer.isBuffer(message)
                ? message.length
                : SerializationCounter.countNeededBytes(message)
        let padding =
            (32 /* header size */ + length + 12) /* min padding */ % 16
        padding = 12 + (padding ? 16 - padding : 0)
        const encryptedWriter = BinaryWriter.alloc(32 + length + padding)

        encryptedWriter.raw(this.serverSalt!)
        encryptedWriter.raw(this._sessionId)
        encryptedWriter.long(messageId)
        encryptedWriter.int32(seqNo)
        encryptedWriter.uint32(length)
        if (Buffer.isBuffer(message)) encryptedWriter.raw(message)
        else encryptedWriter.object(message as tl.TlObject)
        encryptedWriter.raw(randomBytes(padding))

        const innerData = encryptedWriter.result()
        const messageKey = (
            await this._crypto.sha256(
                Buffer.concat([this._authKeyClientSalt!, innerData])
            )
        ).slice(8, 24)
        const ige = await createAesIgeForMessage(
            this._crypto,
            this._authKey,
            messageKey,
            true
        )
        const encryptedData = await ige.encrypt(innerData)

        return Buffer.concat([this._authKeyId!, messageKey, encryptedData])
    }

    /** Decrypt a single MTProto message using session's keys */
    async decryptMessage(data: Buffer): Promise<EncryptedMessage | null> {
        if (!this._authKey) throw new Error('Keys are not set up!')

        const reader = new BinaryReader(data)

        const authKeyId = reader.raw(8)
        const messageKey = reader.int128()
        const encryptedData = reader.raw()

        if (!buffersEqual(authKeyId, this._authKeyId!)) {
            debug(
                '[%h] warn: received message with unknown authKey = %h (expected %h)',
                this._sessionId,
                authKeyId,
                this._authKeyId
            )
            return null
        }

        const ige = await createAesIgeForMessage(
            this._crypto,
            this._authKey!,
            messageKey,
            false
        )
        const innerData = await ige.decrypt(encryptedData)

        const expectedMessageKey = (
            await this._crypto.sha256(
                Buffer.concat([this._authKeyServerSalt!, innerData])
            )
        ).slice(8, 24)
        if (!buffersEqual(messageKey, expectedMessageKey)) {
            debug(
                '[%h] warn: received message with invalid messageKey = %h (expected %h)',
                this._sessionId,
                messageKey,
                expectedMessageKey
            )
            return null
        }

        const innerReader = new BinaryReader(innerData)
        innerReader.seek(8) // skip salt
        const sessionId = innerReader.raw(8)
        const messageId = innerReader.long(true)

        if (!buffersEqual(sessionId, this._sessionId)) {
            debug(
                'warn: ignoring message with invalid sessionId = %h',
                sessionId
            )
            return null
        }

        const seqNo = innerReader.uint32()
        const length = innerReader.uint32()

        if (length > innerData.length - 32 /* header size */) {
            debug(
                'warn: ignoring message with invalid length: %d > %d',
                length,
                innerData.length - 32
            )
            return null
        }

        if (length % 4 !== 0) {
            debug(
                'warn: ignoring message with invalid length: %d is not a multiple of 4',
                length
            )
            return null
        }

        const content = innerReader.object()
        return {
            messageId,
            seqNo,
            content,
        }
    }
}
