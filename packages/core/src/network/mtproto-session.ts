import Long from 'long'

import { mtp, tl } from '@mtcute/tl'
import {
    TlBinaryWriter,
    TlReaderMap,
    TlSerializationCounter,
    TlWriterMap,
} from '@mtcute/tl-runtime'

import { getRandomInt, ICryptoProvider, Logger, randomLong } from '../utils'
import { buffersEqual, randomBytes } from '../utils/buffer-utils'
import {
    ICryptoProvider,
    Logger,
    getRandomInt,
    randomLong,
    ControllablePromise,
    LruSet,
    Deque,
    SortedArray,
    LongMap,
} from '../utils'
import { AuthKey } from './auth-key'
import { createAesIgeForMessage } from '../utils/crypto/mtproto'

export interface PendingRpc {
    method: string
    data: Buffer
    promise: ControllablePromise
    stack?: string
    gzipOverhead?: number

    sent?: boolean
    msgId?: Long
    seqNo?: number
    containerId?: Long
    acked?: boolean
    initConn?: boolean
    getState?: number
    cancelled?: boolean
    timeout?: number
}

export type PendingMessage =
    | {
          _: 'rpc'
          rpc: PendingRpc
      }
    | {
          _: 'container'
          msgIds: Long[]
      }
    | {
          _: 'state'
          msgIds: Long[]
          containerId: Long
      }
    | {
          _: 'resend'
          msgIds: Long[]
          containerId: Long
      }
    | {
          _: 'ping'
          pingId: Long
          containerId: Long
      }
    | {
          _: 'destroy_session'
          sessionId: Long
          containerId: Long
      }
    | {
          _: 'cancel'
          msgId: Long
          containerId: Long
      }
    | {
          _: 'future_salts'
          containerId: Long
      }

/**
 * Class encapsulating a single MTProto session and storing
 * all the relevant state
 */
export class MtprotoSession {
    _sessionId = randomLong()

    _authKey = new AuthKey(this._crypto, this.log, this._readerMap)

    _timeOffset = 0
    _lastMessageId = Long.ZERO
    _seqNo = 0

    serverSalt = Long.ZERO

    /// state ///
    // recent msg ids
    recentOutgoingMsgIds = new LruSet<Long>(1000, false, true)
    recentIncomingMsgIds = new LruSet<Long>(1000, false, true)

    // queues
    queuedRpc = new Deque<PendingRpc>()
    queuedAcks: Long[] = []
    queuedStateReq: Long[] = []
    queuedResendReq: Long[] = []
    queuedCancelReq: Long[] = []
    getStateSchedule = new SortedArray<PendingRpc>(
        [],
        (a, b) => a.getState! - b.getState!
    )

    // requests info
    pendingMessages = new LongMap<PendingMessage>()

    initConnectionCalled = false

    constructor(
        readonly _crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap,
        readonly _writerMap: TlWriterMap,
    ) {
        this.log.prefix = `[SESSION ${this._sessionId.toString(16)}] `
    }

    /**
     * Reset session by resetting auth key(s) and session state
     */
    reset(): void {
        this._authKey.reset()

        this.resetState()
    }

    /**
     * Reset session state and generate a new session ID.
     *
     * By default, also cancels any pending RPC requests.
     * If `keepPending` is set to `true`, pending requests will be kept
     */
    resetState(keepPending = false): void {
        this._lastMessageId = Long.ZERO
        this._seqNo = 0

        this._sessionId = randomLong()
        this.log.debug('session reset, new sid = %l', this._sessionId)
        this.log.prefix = `[SESSION ${this._sessionId.toString(16)}] `

        // reset session state

        if (!keepPending) {
            for (const info of this.pendingMessages.values()) {
                if (info._ === 'rpc') {
                    info.rpc.promise.reject(new Error('Session is reset'))
                }
            }
            this.pendingMessages.clear()
        }

        this.recentOutgoingMsgIds.clear()
        this.recentIncomingMsgIds.clear()

        if (!keepPending) {
            while (this.queuedRpc.length) {
                const rpc = this.queuedRpc.popFront()!

                if (rpc.sent === false) {
                    rpc.promise.reject(new Error('Session is reset'))
                }
            }
        }

        this.queuedAcks.length = 0
        this.queuedStateReq.length = 0
        this.queuedResendReq.length = 0
        this.getStateSchedule.clear()
    }

    enqueueRpc(rpc: PendingRpc, force?: boolean): boolean {
        // already queued or cancelled
        if ((!force && !rpc.sent) || rpc.cancelled) return false

        rpc.sent = false
        rpc.containerId = undefined
        this.log.debug(
            'enqueued %s for sending (msg_id = %s)',
            rpc.method,
            rpc.msgId || 'n/a'
        )
        this.queuedRpc.pushBack(rpc)
        return true
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
        isContentRelated = true,
    ): Long {
        const messageId = this.getMessageId()
        const seqNo = this.getSeqNo(isContentRelated)

        const length = Buffer.isBuffer(content) ?
            content.length :
            TlSerializationCounter.countNeededBytes(
                  writer.objectMap!,
                  content,
            )

        writer.long(messageId)
        writer.int(seqNo)
        writer.uint(length)
        if (Buffer.isBuffer(content)) writer.raw(content)
        else writer.object(content as tl.TlObject)

        return messageId
    }
}
