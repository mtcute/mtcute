import type { mtp, tl } from '@mtcute/tl'
import type { TlBinaryWriter, TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'
import type {
    ICryptoProvider,
    Logger,
} from '../utils/index.js'
import type { ServerSaltManager } from './server-salt.js'
import { type Deferred, Deque, LruSet, timers } from '@fuman/utils'

import { TlSerializationCounter } from '@mtcute/tl-runtime'
import Long from 'long'
import { MtcuteError } from '../types/index.js'

import {
    compareLongs,
    getRandomInt,
    LongMap,
    LongSet,
    randomLong,
    SortedArray,
} from '../utils/index.js'
import { AuthKey } from './auth-key.js'

export interface PendingRpc {
    method: string
    data: Uint8Array
    promise: Deferred<unknown>
    stack?: string
    gzipOverhead?: number

    chainId?: string | number
    invokeAfter?: Long

    sent?: boolean
    done?: boolean
    msgId?: Long
    seqNo?: number
    containerId?: Long
    acked?: boolean
    initConn?: boolean
    getState?: number
    cancelled?: boolean
    timeout?: timers.Timer
    resetAbortSignal?: () => void
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
      promise: Deferred<boolean | mtp.RawMt_rpc_error>
  }

/**
 * Class encapsulating a single MTProto session and storing
 * all the relevant state
 */
export class MtprotoSession {
    _sessionId: Long = randomLong()

    _authKey: AuthKey
    _authKeyTemp: AuthKey
    _authKeyTempSecondary: AuthKey

    _timeOffset: number = performance.timeOrigin
    _lastMessageId: Long = Long.ZERO
    _seqNo = 0

    /// state ///
    // recent msg ids
    recentOutgoingMsgIds: LruSet<Long> = new LruSet(1000, LongSet)
    recentIncomingMsgIds: LruSet<Long> = new LruSet(1000, LongSet)

    // queues
    queuedRpc: Deque<PendingRpc> = new Deque()
    queuedAcks: Long[] = []
    queuedStateReq: Long[] = []
    queuedResendReq: Long[] = []
    queuedCancelReq: Long[] = []
    getStateSchedule: SortedArray<PendingRpc> = new SortedArray<PendingRpc>([], (a, b) => a.getState! - b.getState!)

    chains: Map<string | number, Long> = new Map()
    chainsPendingFails: Map<string | number, SortedArray<PendingRpc>> = new Map()

    // requests info
    pendingMessages: LongMap<PendingMessage> = new LongMap()
    destroySessionIdToMsgId: LongMap<Long> = new LongMap()

    lastPingRtt: number = Number.NaN
    lastPingTime = 0
    lastPingMsgId: Long = Long.ZERO
    lastSessionCreatedUid: Long = Long.ZERO

    initConnectionCalled = false
    authorizationPending = false

    next429Timeout = 1000
    current429Timeout?: timers.Timer
    next429ResetTimeout?: timers.Timer

    constructor(
        readonly _crypto: ICryptoProvider,
        readonly log: Logger,
        readonly _readerMap: TlReaderMap,
        readonly _writerMap: TlWriterMap,
        readonly _salts: ServerSaltManager,
    ) {
        this.log.prefix = `[SESSION ${this._sessionId.toString(16)}] `

        this._authKey = new AuthKey(_crypto, log, _readerMap)
        this._authKeyTemp = new AuthKey(_crypto, log, _readerMap)
        this._authKeyTempSecondary = new AuthKey(_crypto, log, _readerMap)
    }

    get hasPendingMessages(): boolean {
        return Boolean(
            this.queuedRpc.length
            || this.queuedAcks.length
            || this.queuedStateReq.length
            || this.queuedResendReq.length,
        )
    }

    /**
     * Reset session by resetting auth key(s) and session state
     */
    reset(withAuthKey = false): void {
        if (withAuthKey) {
            this.resetAuthKey()
        }

        timers.clearTimeout(this.current429Timeout)
        this.resetState(withAuthKey)
    }

    resetAuthKey(): void {
        this._authKey.reset()
        this._authKeyTemp.reset()
        this._authKeyTempSecondary.reset()
    }

    updateTimeOffset(offset: number): void {
        this.log.debug('time offset updated: %d', offset)
        this._timeOffset = offset
        // lastMessageId was generated with (potentially) wrong time
        // reset it to avoid bigger issues - at worst, we'll get bad_msg_notification
        this._lastMessageId = Long.ZERO
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
                    this.log.debug('rejecting pending rpc %s', info.rpc.method)
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
                    this.log.debug('rejecting pending rpc %s', rpc.method)
                    rpc.promise.reject(new MtcuteError('Session is reset'))
                }
            }
        }

        this.queuedAcks.length = 0
        this.queuedStateReq.length = 0
        this.queuedResendReq.length = 0
        this.queuedCancelReq.length = 0
        this.getStateSchedule.clear()
        this.chains.clear()
        this.chainsPendingFails.clear()
        this.resetLastPing(true)
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
        const timeTicks = performance.now()
        const timeSec = Math.floor(timeTicks / 1000) + this._timeOffset
        const timeMSec = timeTicks % 1000
        const random = getRandomInt(0xFFFF)

        let messageId = new Long((timeMSec << 21) | (random << 3) | 4, timeSec)

        if (this._lastMessageId.ge(messageId)) {
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
    encryptMessage(message: Uint8Array): Uint8Array {
        const key = this._authKeyTemp.ready ? this._authKeyTemp : this._authKey

        return key.encryptMessage(message, this._salts.currentSalt, this._sessionId)
    }

    /** Decrypt a single MTProto message using session's keys */
    decryptMessage(data: Uint8Array, callback: Parameters<AuthKey['decryptMessage']>[2]): void {
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

        const length = ArrayBuffer.isView(content)
            ? content.length
            : TlSerializationCounter.countNeededBytes(writer.objectMap!, content)

        writer.long(messageId)
        writer.int(seqNo)
        writer.uint(length)
        if (ArrayBuffer.isView(content)) writer.raw(content)
        else writer.object(content as tl.TlObject)

        return messageId
    }

    onTransportFlood(callback: () => void): void {
        if (this.current429Timeout) return // already waiting

        // all active queries must be resent after a timeout
        this.resetLastPing(true)

        const timeout = this.next429Timeout

        this.next429Timeout = Math.min(this.next429Timeout * 2, 32000)
        timers.clearTimeout(this.current429Timeout)
        timers.clearTimeout(this.next429ResetTimeout)

        this.current429Timeout = timers.setTimeout(() => {
            this.current429Timeout = undefined
            callback()
        }, timeout)
        this.next429ResetTimeout = timers.setTimeout(() => {
            this.next429ResetTimeout = undefined
            this.next429Timeout = 1000
        }, 60000)

        this.log.debug('transport flood, waiting for %d ms before proceeding', timeout)
    }

    resetLastPing(withTime = false): void {
        if (withTime) this.lastPingTime = 0

        if (!this.lastPingMsgId.isZero()) {
            this.pendingMessages.delete(this.lastPingMsgId)
        }

        this.lastPingMsgId = Long.ZERO
    }

    addToChain(chainId: string | number, msgId: Long): Long | undefined {
        const prevMsgId = this.chains.get(chainId)
        this.chains.set(chainId, msgId)

        this.log.debug('added message %l to chain %s (prev: %l)', msgId, chainId, prevMsgId)

        return prevMsgId
    }

    removeFromChain(chainId: string | number, msgId: Long): void {
        const lastMsgId = this.chains.get(chainId)

        if (!lastMsgId) {
            this.log.warn('tried to remove message %l from empty chain %s', msgId, chainId)

            return
        }

        if (lastMsgId.eq(msgId)) {
            // last message of the chain, remove it
            this.log.debug('chain %s: exhausted, last message %l', chainId, msgId)
            this.chains.delete(chainId)
        }

        // do nothing
    }

    getPendingChainedFails(chainId: string | number): SortedArray<PendingRpc> {
        let arr = this.chainsPendingFails.get(chainId)

        if (!arr) {
            arr = new SortedArray<PendingRpc>([], (a, b) => compareLongs(a.invokeAfter!, b.invokeAfter!))
            this.chainsPendingFails.set(chainId, arr)
        }

        return arr
    }
}
