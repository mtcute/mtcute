import Long from 'long'

import { mtp, tl } from '@mtcute/tl'
import { TlBinaryWriter, TlReaderMap, TlSerializationCounter, TlWriterMap } from '@mtcute/tl-runtime'

import { MtcuteError } from '../types/index.js'
import {
    ControllablePromise,
    Deque,
    getRandomInt,
    ICryptoProvider,
    Logger,
    LongMap,
    LruSet,
    randomLong,
    SortedArray,
} from '../utils/index.js'
import { AuthKey } from './auth-key.js'

export interface PendingRpc {
    method: string
    data: Uint8Array
    promise: ControllablePromise
    stack?: string
    gzipOverhead?: number

    sent?: boolean
    done?: boolean
    msgId?: Long
    seqNo?: number
    containerId?: Long
    acked?: boolean
    initConn?: boolean
    getState?: number
    cancelled?: boolean
    timeout?: NodeJS.Timeout
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
    | {
          _: 'bind'
          promise: ControllablePromise
      }

/**
 * Class encapsulating a single MTProto session and storing
 * all the relevant state
 */
export class MtprotoSession {
    _sessionId = randomLong()

    _authKey = new AuthKey(this._crypto, this.log, this._readerMap)
    _authKeyTemp = new AuthKey(this._crypto, this.log, this._readerMap)
    _authKeyTempSecondary = new AuthKey(this._crypto, this.log, this._readerMap)

    _timeOffset = 0
    _lastMessageId = Long.ZERO
    _seqNo = 0

    serverSalt = Long.ZERO

    /// state ///
    // recent msg ids
    recentOutgoingMsgIds = new LruSet<Long>(1000, true)
    recentIncomingMsgIds = new LruSet<Long>(1000, true)

    // queues
    queuedRpc = new Deque<PendingRpc>()
    queuedAcks: Long[] = []
    queuedStateReq: Long[] = []
    queuedResendReq: Long[] = []
    queuedCancelReq: Long[] = []
    getStateSchedule = new SortedArray<PendingRpc>([], (a, b) => a.getState! - b.getState!)

    // requests info
    pendingMessages = new LongMap<PendingMessage>()
    destroySessionIdToMsgId = new LongMap<Long>()

    lastPingRtt = NaN
    lastPingTime = 0
    lastPingMsgId = Long.ZERO
    lastSessionCreatedUid = Long.ZERO

    initConnectionCalled = false
    authorizationPending = false

    next429Timeout = 1000
    current429Timeout?: NodeJS.Timeout
    next429ResetTimeout?: NodeJS.Timeout

    constructor(
        readonly _crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap,
        readonly _writerMap: TlWriterMap,
    ) {
        this.log.prefix = `[SESSION ${this._sessionId.toString(16)}] `
    }

    get hasPendingMessages(): boolean {
        return Boolean(
            this.queuedRpc.length ||
                this.queuedAcks.length ||
                this.queuedStateReq.length ||
                this.queuedResendReq.length,
        )
    }

    /**
     * Reset session by resetting auth key(s) and session state
     */
    reset(withAuthKey = false): void {
        if (withAuthKey) {
            this._authKey.reset()
            this._authKeyTemp.reset()
            this._authKeyTempSecondary.reset()
        }

        clearTimeout(this.current429Timeout)
        this.resetState()
        this.resetLastPing(true)
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
        this.log.debug('session reset, new sid = %h', this._sessionId)
        this.log.prefix = `[SESSION ${this._sessionId.toString(16)}] `

        // reset session state

        if (!keepPending) {
            for (const info of this.pendingMessages.values()) {
                if (info._ === 'rpc') {
                    info.rpc.promise.reject(new MtcuteError('Session is reset'))
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
                    rpc.promise.reject(new MtcuteError('Session is reset'))
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
        this.log.debug('enqueued %s for sending (msg_id = %s)', rpc.method, rpc.msgId || 'n/a')
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
        let seqNo = this._seqNo

        if (isContentRelated) {
            seqNo += 1
            this._seqNo += 2
        }

        return seqNo
    }

    /** Encrypt a single MTProto message using session's keys */
    async encryptMessage(message: Uint8Array): Promise<Uint8Array> {
        const key = this._authKeyTemp.ready ? this._authKeyTemp : this._authKey

        return key.encryptMessage(message, this.serverSalt, this._sessionId)
    }

    /** Decrypt a single MTProto message using session's keys */
    async decryptMessage(data: Uint8Array, callback: Parameters<AuthKey['decryptMessage']>[2]): Promise<void> {
        if (!this._authKey.ready) throw new MtcuteError('Keys are not set up!')

        const authKeyId = data.subarray(0, 8)

        let key: AuthKey

        if (this._authKey.match(authKeyId)) {
            key = this._authKey
        } else if (this._authKeyTemp.match(authKeyId)) {
            key = this._authKeyTemp
        } else if (this._authKeyTempSecondary.match(authKeyId)) {
            key = this._authKeyTempSecondary
        } else {
            this.log.warn(
                'received message with unknown authKey = %h (expected %h or %h or %h)',
                authKeyId,
                this._authKey.id,
                this._authKeyTemp.id,
                this._authKeyTempSecondary.id,
            )

            return
        }

        return key.decryptMessage(data, this._sessionId, callback)
    }

    writeMessage(
        writer: TlBinaryWriter,
        content: tl.TlObject | mtp.TlObject | Uint8Array,
        isContentRelated = true,
    ): Long {
        const messageId = this.getMessageId()
        const seqNo = this.getSeqNo(isContentRelated)

        const length = ArrayBuffer.isView(content) ?
            content.length :
            TlSerializationCounter.countNeededBytes(writer.objectMap!, content)

        writer.long(messageId)
        writer.int(seqNo)
        writer.uint(length)
        if (ArrayBuffer.isView(content)) writer.raw(content)
        else writer.object(content as tl.TlObject)

        return messageId
    }

    onTransportFlood(callback: () => void) {
        if (this.current429Timeout) return // already waiting

        // all active queries must be resent after a timeout
        this.resetLastPing(true)

        const timeout = this.next429Timeout

        this.next429Timeout = Math.min(this.next429Timeout * 2, 32000)
        clearTimeout(this.current429Timeout)
        clearTimeout(this.next429ResetTimeout)

        this.current429Timeout = setTimeout(() => {
            this.current429Timeout = undefined
            callback()
        }, timeout)
        this.next429ResetTimeout = setTimeout(() => {
            this.next429ResetTimeout = undefined
            this.next429Timeout = 1000
        }, 60000)

        this.log.debug('transport flood, waiting for %d ms before proceeding', timeout)

        return Date.now() + timeout
    }

    resetLastPing(withTime = false): void {
        if (withTime) this.lastPingTime = 0

        if (!this.lastPingMsgId.isZero()) {
            this.pendingMessages.delete(this.lastPingMsgId)
        }

        this.lastPingMsgId = Long.ZERO
    }
}
