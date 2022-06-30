import Long from 'long'
import { mtp, tl } from '@mtcute/tl'
import {
    TlBinaryReader,
    TlBinaryWriter,
    TlReaderMap,
    TlSerializationCounter,
    TlWriterMap,
} from '@mtcute/tl-runtime'

import { createAesIgeForMessage } from '../utils/crypto/mtproto'
import { buffersEqual, randomBytes } from '../utils/buffer-utils'
import { ICryptoProvider, Logger, getRandomInt, randomLong } from '../utils'

/**
 * Class encapsulating a single MTProto session.
 * Provides means to en-/decrypt messages
 */
export class MtprotoSession {
    readonly _crypto: ICryptoProvider

    _sessionId = randomLong()

    _authKey?: Buffer
    _authKeyId?: Buffer
    _authKeyClientSalt?: Buffer
    _authKeyServerSalt?: Buffer

    _timeOffset = 0
    _lastMessageId = Long.ZERO
    _seqNo = 0

    serverSalt = Long.ZERO

    constructor(
        crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap,
        readonly _writerMap: TlWriterMap
    ) {
        this._crypto = crypto
    }

    /** Whether session contains authKey */
    get authorized(): boolean {
        return this._authKey !== undefined
    }

    /** Setup keys based on authKey */
    async setupKeys(authKey?: Buffer | null): Promise<void> {
        if (authKey) {
            this._authKey = authKey
            this._authKeyClientSalt = authKey.slice(88, 120)
            this._authKeyServerSalt = authKey.slice(96, 128)
            this._authKeyId = (await this._crypto.sha1(this._authKey)).slice(-8)
        } else {
            this._authKey = undefined
            this._authKeyClientSalt = undefined
            this._authKeyServerSalt = undefined
            this._authKeyId = undefined
        }
    }

    /** Reset session by removing authKey and values derived from it */
    reset(): void {
        this._lastMessageId = Long.ZERO
        this._seqNo = 0

        this._authKey = undefined
        this._authKeyClientSalt = undefined
        this._authKeyServerSalt = undefined
        this._authKeyId = undefined
        this._sessionId = randomLong()
        // no need to reset server salt
    }

    changeSessionId(): void {
        this._sessionId = randomLong()
        this._seqNo = 0
    }

    /** Encrypt a single MTProto message using session's keys */
    async encryptMessage(message: Buffer): Promise<Buffer> {
        if (!this._authKey) throw new Error('Keys are not set up!')

        let padding =
            (16 /* header size */ + message.length + 12) /* min padding */ % 16
        padding = 12 + (padding ? 16 - padding : 0)

        const buf = Buffer.alloc(16 + message.length + padding)

        buf.writeInt32LE(this.serverSalt!.low)
        buf.writeInt32LE(this.serverSalt!.high, 4)
        buf.writeInt32LE(this._sessionId.low, 8)
        buf.writeInt32LE(this._sessionId.high, 12)
        message.copy(buf, 16)
        randomBytes(padding).copy(buf, 16 + message.length)

        const messageKey = (
            await this._crypto.sha256(
                Buffer.concat([this._authKeyClientSalt!, buf])
            )
        ).slice(8, 24)
        const ige = await createAesIgeForMessage(
            this._crypto,
            this._authKey,
            messageKey,
            true
        )
        const encryptedData = await ige.encrypt(buf)

        return Buffer.concat([this._authKeyId!, messageKey, encryptedData])
    }

    /** Decrypt a single MTProto message using session's keys */
    async decryptMessage(
        data: Buffer,
        callback: (msgId: tl.Long, seqNo: number, data: TlBinaryReader) => void
    ): Promise<void> {
        if (!this._authKey) throw new Error('Keys are not set up!')

        const authKeyId = data.slice(0, 8)
        const messageKey = data.slice(8, 24)

        let encryptedData = data.slice(24)

        if (!buffersEqual(authKeyId, this._authKeyId!)) {
            this.log.warn(
                '[%h] warn: received message with unknown authKey = %h (expected %h)',
                this._sessionId,
                authKeyId,
                this._authKeyId
            )
            return
        }

        const padSize = encryptedData.length % 16
        if (padSize !== 0) {
            // data came from a codec that uses non-16-based padding.
            // it is safe to drop those padding bytes
            encryptedData = encryptedData.slice(0, -padSize)
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
            this.log.warn(
                '[%h] received message with invalid messageKey = %h (expected %h)',
                this._sessionId,
                messageKey,
                expectedMessageKey
            )
            return
        }

        const innerReader = new TlBinaryReader(this._readerMap, innerData)
        innerReader.seek(8) // skip salt
        const sessionId = innerReader.long()
        const messageId = innerReader.long(true)

        if (sessionId.neq(this._sessionId)) {
            this.log.warn(
                'ignoring message with invalid sessionId = %h',
                sessionId
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

    getMessageId(): Long {
        const timeTicks = Date.now()
        const timeSec = Math.floor(timeTicks / 1000) + this._timeOffset
        const timeMSec = timeTicks % 1000
        const random = getRandomInt(0xffff)

        let messageId = new Long((timeMSec << 21) | (random << 3) | 4, timeSec)

        if (this._lastMessageId.gt(messageId)) {
            messageId = this._lastMessageId.add(4)
        }

        this._lastMessageId = messageId

        return messageId
    }

    getSeqNo(isContentRelated = true): number {
        let seqNo = this._seqNo * 2

        if (isContentRelated) {
            seqNo += 1
            this._seqNo += 1
        }

        return seqNo
    }

    writeMessage(
        writer: TlBinaryWriter,
        content: tl.TlObject | mtp.TlObject | Buffer,
        isContentRelated = true
    ): Long {
        const messageId = this.getMessageId()
        const seqNo = this.getSeqNo(isContentRelated)

        const length = Buffer.isBuffer(content)
            ? content.length
            : TlSerializationCounter.countNeededBytes(
                  writer.objectMap!,
                  content
              )

        writer.long(messageId)
        writer.int(seqNo)
        writer.uint(length)
        if (Buffer.isBuffer(content)) writer.raw(content)
        else writer.object(content as tl.TlObject)

        return messageId
    }
}
