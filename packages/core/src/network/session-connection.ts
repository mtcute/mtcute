/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// will be reworked in MTQ-32
import Long from 'long'

import { mtp, tl } from '@mtcute/tl'
import {
    TlBinaryReader,
    TlBinaryWriter,
    TlReaderMap,
    TlSerializationCounter,
    TlWriterMap,
} from '@mtcute/tl-runtime'
import { gzipDeflate, gzipInflate } from '@mtcute/tl-runtime/src/platform/gzip'

import {
    ControllablePromise,
    createCancellablePromise,
    Deque,
    EarlyTimer,
    Logger,
    LongMap,
    LruSet,
    randomLong,
    removeFromLongArray,
    SortedArray,
} from '../utils'
import { MtprotoSession, PendingMessage, PendingRpc } from './mtproto-session'
import { doAuthorization } from './authorization'
import { MtprotoSession } from './mtproto-session'
import {
    PersistentConnection,
    PersistentConnectionParams,
} from './persistent-connection'
import { TransportError } from './transports'

export interface SessionConnectionParams extends PersistentConnectionParams {
    initConnection: tl.RawInitConnectionRequest
    inactivityTimeout?: number
    niceStacks?: boolean
    layer: number
    disableUpdates?: boolean
    isMainConnection: boolean
    usePfs?: boolean

    readerMap: TlReaderMap
    writerMap: TlWriterMap
}

// destroy_session#e7512126 session_id:long
// todo
const DESTROY_SESSION_ID = Buffer.from('262151e7', 'hex')

function makeNiceStack(
    error: tl.errors.RpcError,
    stack: string,
    method?: string,
) {
    error.stack = `${error.constructor.name} (${error.code} ${error.text}): ${
        error.message
    }\n    at ${method}\n${stack.split('\n').slice(2).join('\n')}`
}

/**
 * A connection to a single DC.
 */
export class SessionConnection extends PersistentConnection {
    readonly params!: SessionConnectionParams

    private _flushTimer = new EarlyTimer()
    private _queuedDestroySession: Long[] = []

    private _next429Timeout = 1000
    private _current429Timeout?: NodeJS.Timeout

    private _lastPingRtt = NaN
    private _lastPingTime = 0
    private _lastPingMsgId = Long.ZERO
    private _lastSessionCreatedUid = Long.ZERO

    private _isPfsBindingPending = false
    private _isPfsBindingPendingInBackground = false
    private _pfsUpdateTimeout?: NodeJS.Timeout

    private _readerMap: TlReaderMap
    private _writerMap: TlWriterMap

    constructor(
        params: SessionConnectionParams,
        readonly _session: MtprotoSession
    ) {
        super(params, _session.log.create('conn'))
        this._flushTimer.onTimeout(this._flush.bind(this))

        this._readerMap = params.readerMap
        this._writerMap = params.writerMap
        this._handleRawMessage = this._handleRawMessage.bind(this)
    }

    async changeDc(dc: tl.RawDcOption, authKey?: Buffer | null): Promise<void> {
        this._session.reset()
        await this._session._authKey.setup(authKey)
        await super.changeDc(dc)
    }

    getAuthKey(temp = false): Buffer | null {
        const key = temp ? this._session._authKeyTemp : this._session._authKey

        if (!key.ready) return null
        return key.key
    }

    onTransportClose(): void {
        super.onTransportClose()
        this.emit('disconnect')

        this.reset()
    }

    destroy(): void {
        super.destroy()
        this.reset(true)
    }

    reset(forever = false): void {
        this._session.initConnectionCalled = false
        this._resetLastPing(true)
        this._flushTimer.reset()
        clearTimeout(this._current429Timeout!)

        if (forever) {
            this.removeAllListeners()
        }
    }

    protected async onConnected(): Promise<void> {
        if (!this._session._authKey.ready) {
            this.log.debug('no perm auth key, authorizing...')
            this._authorize()
        } else {
            this.log.debug('auth keys are already available')
            this.onConnectionUsable()
        }
    }

    protected onError(error: Error): void {
        // https://core.telegram.org/mtproto/mtproto-_transports#_transport-errors
        if (error instanceof TransportError) {
            this.log.error('transport error %d', error.code)

            if (error.code === 404) {
                this._session.reset()
                this.emit('key-change', null)
                this._authorize()

                return
            }

            if (error.code === 429) {
                // all active queries must be resent
                const timeout = this._next429Timeout

                this._next429Timeout = Math.min(this._next429Timeout * 2, 16000)
                clearTimeout(this._current429Timeout!)
                this._current429Timeout = setTimeout(() => {
                    this._current429Timeout = undefined
                    this._flushTimer.emitNow()
                }, timeout)

                this.log.debug(
                    'transport flood, waiting for %d ms before proceeding',
                    timeout,
                )

                for (const msgId of this._session.pendingMessages.keys()) {
                    const info = this._session.pendingMessages.get(msgId)!

                    if (info._ === 'container') {
                        this._session.pendingMessages.delete(msgId)
                    } else {
                        this._onMessageFailed(msgId, 'transport flood', true)
                    }
                }

                return
            }
        }

        this.emit('error', error)
    }

    protected onConnectionUsable() {
        super.onConnectionUsable()

        // just in case
        this._flushTimer.emitBeforeNext(1000)
    }

    private _authorize(): void {
        doAuthorization(this, this.params.crypto)
            .then(async ([authKey, serverSalt, timeOffset]) => {
                await this._session._authKey.setup(authKey)
                this._session.serverSalt = serverSalt
                this._session._timeOffset = timeOffset

                this.emit('key-change', authKey)

                this.onConnectionUsable()
            })
            .catch((err) => {
                this.log.error('Authorization error: %s', err.message)
                this.onError(err)
                this.reconnect()
            })
    }

    protected async onMessage(data: Buffer): Promise<void> {
        if (!this._session._authKey.ready) {
            // if a message is received before authorization,
            // either the server is misbehaving,
            // or there was a problem with authorization.
            this.log.warn('received message before authorization: %h', data)

            return
        }

        try {
            await this._session._authKey.decryptMessage(
                data,
                this._session._sessionId,
                this._handleRawMessage
            )
        } catch (err) {
            this.log.error('failed to decrypt message: %s\ndata: %h', err, data)
        }
    }

    private _handleRawMessage(
        messageId: Long,
        seqNo: number,
        message: TlBinaryReader,
    ): void {
        if (message.peekUint() === 0x3072cfa1) {
            // gzip_packed
            // we can't use message.gzip() because it may contain msg_container,
            // so we parse it manually.
            message.uint()

            return this._handleRawMessage(
                messageId,
                seqNo,
                new TlBinaryReader(
                    this._readerMap,
                    gzipInflate(message.bytes()),
                ),
            )
        }

        if (message.peekUint() === 0x73f1f8dc) {
            // msg_container
            message.uint()
            const count = message.uint()

            for (let i = 0; i < count; i++) {
                // msg_id:long seqno:int bytes:int
                const msgId = message.long()
                message.uint() // seqno
                const length = message.uint()

                // container can't contain other containers, so we are safe
                const start = message.pos
                const obj = message.object()

                // ensure length
                if (message.pos - start !== length) {
                    this.log.warn(
                        'received message with invalid length in container (%d != %d)',
                        message.pos - start,
                        length,
                    )
                }

                this._handleMessage(msgId, obj)
            }

            return
        }

        if (message.peekUint() === 0xf35c6d01) {
            // rpc_result
            message.uint()

            return this._onRpcResult(message)
        }

        // we are safe.. i guess
        this._handleMessage(messageId, message.object())
    }

    private _handleMessage(messageId: Long, message_: unknown): void {
        if (messageId.isEven()) {
            this.log.warn(
                'warn: ignoring message with invalid messageId = %s (is even)',
                messageId,
            )

            return
        }

        if (this._session.recentIncomingMsgIds.has(messageId)) {
            this.log.warn('warn: ignoring duplicate message %s', messageId)

            return
        }
        const message = message_ as mtp.TlObject

        this.log.verbose('received %s (msg_id: %l)', message._, messageId)
        this._session.recentIncomingMsgIds.add(messageId)

        switch (message._) {
            case 'mt_msgs_ack':
            case 'mt_http_wait':
            case 'mt_bad_msg_notification':
            case 'mt_bad_server_salt':
            case 'mt_msgs_all_info':
            case 'mt_msgs_state_info':
            case 'mt_msg_detailed_info':
            case 'mt_msg_new_detailed_info':
                break
            default:
                this._sendAck(messageId)
        }

        switch (message._) {
            case 'mt_pong':
                this._onPong(message)
                break
            case 'mt_bad_server_salt':
                this._onBadServerSalt(message)
                break
            case 'mt_bad_msg_notification':
                this._onBadMsgNotification(messageId, message)
                break
            case 'mt_msgs_ack':
                message.msgIds.forEach((msgId) => this._onMessageAcked(msgId))
                break
            case 'mt_new_session_created':
                this._onNewSessionCreated(message)
                break
            case 'mt_msgs_all_info':
                this._onMessagesInfo(message.msgIds, message.info)
                break
            case 'mt_msg_detailed_info':
                this._onMessageInfo(
                    message.msgId,
                    message.status,
                    message.answerMsgId,
                )
                break
            case 'mt_msg_new_detailed_info':
                this._onMessageInfo(Long.ZERO, 0, message.answerMsgId)
                break
            case 'mt_msgs_state_info':
                this._onMsgsStateInfo(message)
                break
            case 'mt_future_salts':
                // todo
                break
            case 'mt_msgs_state_req':
            case 'mt_msg_resend_req':
                // tdlib doesnt handle them, so why should we? :upside_down_face:
                this.log.warn(
                    'received %s (msg_id = %l): %j',
                    message._,
                    messageId,
                    message,
                )
                break
            default:
                if (tl.isAnyUpdates(message)) {
                    if (this._usable && this.params.inactivityTimeout) {
                        this._rescheduleInactivity()
                    }

                    if (this.params.disableUpdates) {
                        this.log.warn(
                            'received updates, but updates are disabled'
                        )
                        break
                    }
                    if (!this.params.isMainConnection) {
                        this.log.warn('received updates on non-main connection')
                        break
                    }

                    this.emit('update', message)

                    return
                }

                this.log.warn('unknown message received: %j', message)
        }
    }

    private _onRpcResult(message: TlBinaryReader): void {
        if (this._usable && this.params.inactivityTimeout) {
            this._rescheduleInactivity()
        }

        const reqMsgId = message.long()

        if (reqMsgId.isZero()) {
            let resultType

            try {
                resultType = (message.object() as any)._
            } catch (err) {
                resultType = message.peekUint()
            }
            this.log.warn(
                'received rpc_result with %s with req_msg_id = 0',
                resultType,
            )

            return
        }

        const msg = this._session.pendingMessages.get(reqMsgId)
        if (!msg) {
            let result

            try {
                result = message.object() as any
            } catch (err) {
                result = '[failed to parse]'
            }
            this.log.warn(
                'received rpc_result with %s with req_msg_id = 0',
                result,
            )

            // check if the msg is one of the recent ones
            if (this._session.recentOutgoingMsgIds.has(reqMsgId)) {
                this.log.debug(
                    'received rpc_result again for %l (contains %s)',
                    reqMsgId,
                    result,
                )
            } else {
                this.log.warn(
                    'received rpc_result for unknown message %l: %j',
                    reqMsgId,
                    result,
                )
            }

            return
        }

        if (msg._ !== 'rpc') {
            this.log.error(
                'received rpc_result for %s request %l',
                msg._,
                reqMsgId,
            )

            return
        }
        const rpc = msg.rpc

        const customReader = this._readerMap._results![rpc.method]
        const result: any = customReader ?
            customReader(message) :
            message.object()

        // initConnection call was definitely received and
        // processed by the server, so we no longer need to use it
        if (rpc.initConn) this._session.initConnectionCalled = true

        this.log.verbose('<<< (%s) %j', rpc.method, result)

        if (result._ === 'mt_rpc_error') {
            const res = result as mtp.RawMt_rpc_error
            this.log.debug(
                'received rpc_error [%d:%s] for %l (%s)',
                res.errorCode,
                res.errorMessage,
                reqMsgId,
                rpc.method,
            )

            if (rpc.cancelled) return

            const error = tl.errors.createRpcErrorFromTl(res)

            if (this.params.niceStacks !== false) {
                makeNiceStack(error, rpc.stack!, rpc.method)
            }

            rpc.promise.reject(error)
        } else {
            this.log.debug(
                'received rpc_result (%s) for request %l (%s)',
                result._,
                reqMsgId,
                rpc.method,
            )

            if (rpc.cancelled) return

            rpc.promise.resolve(result)
        }

        this._onMessageAcked(reqMsgId)
        this._session.pendingMessages.delete(reqMsgId)
    }

    private _onMessageAcked(msgId: Long, inContainer = false): void {
        const msg = this._session.pendingMessages.get(msgId)

        if (!msg) {
            this.log.warn('received ack for unknown message %l', msgId)

            return
        }

        switch (msg._) {
            case 'container':
                this.log.debug(
                    'received ack for container %l (size = %d)',
                    msgId,
                    msg.msgIds.length,
                )

                msg.msgIds.forEach((msgId) => this._onMessageAcked(msgId, true))

                // we no longer need info about the container
                this._session.pendingMessages.delete(msgId)
                break

            case 'rpc': {
                const rpc = msg.rpc
                this.log.debug(
                    'received ack for rpc query %l (%s, acked before = %s)',
                    msgId,
                    rpc.method,
                    rpc.acked,
                )

                rpc.acked = true

                if (
                    !inContainer &&
                    rpc.containerId &&
                    this._session.pendingMessages.has(rpc.containerId)
                ) {
                    // ack all the messages in that container
                    this._onMessageAcked(rpc.containerId)
                }

                // this message could also already be in some queue,
                removeFromLongArray(this._session.queuedStateReq, msgId)
                removeFromLongArray(this._session.queuedResendReq, msgId)

                // if resend/state was already requested, it will simply be ignored

                this._session.getStateSchedule.remove(rpc)
                break
            }
            default:
                if (!inContainer) {
                    this.log.warn(
                        'received unexpected ack for %s query %l',
                        msg._,
                        msgId,
                    )
                }
        }
    }

    private _onMessageFailed(
        msgId: Long,
        reason: string,
        inContainer = false,
    ): void {
        const msgInfo = this._session.pendingMessages.get(msgId)
        if (!msgInfo) {
            this.log.debug(
                'unknown message %l failed because of %s',
                msgId,
                reason,
            )

            return
        }

        switch (msgInfo._) {
            case 'container':
                this.log.debug(
                    'container %l (size = %d) failed because of %s',
                    msgId,
                    msgInfo.msgIds.length,
                    reason,
                )
                msgInfo.msgIds.forEach((msgId) =>
                    this._onMessageFailed(msgId, reason, true),
                )
                break
            case 'ping':
                this.log.debug(
                    'ping (msg_id = %l) failed because of %s',
                    msgId,
                    reason,
                )
                // restart ping
                this._resetLastPing(true)
                break

            case 'rpc': {
                const rpc = msgInfo.rpc
                this.log.debug(
                    'rpc query %l (%s) failed because of %s',
                    msgId,
                    rpc.method,
                    reason,
                )

                // since the query was rejected, we can let it reassign msg_id to avoid containers
                this._session.pendingMessages.delete(msgId)
                rpc.msgId = undefined
                this._enqueueRpc(rpc, true)

                if (
                    !inContainer &&
                    rpc.containerId &&
                    this._session.pendingMessages.has(rpc.containerId)
                ) {
                    // fail all the messages in that container
                    this._onMessageFailed(rpc.containerId, reason)
                }

                // this message could also already be in some queue,
                removeFromLongArray(this._session.queuedStateReq, msgId)
                removeFromLongArray(this._session.queuedResendReq, msgId)

                // if resend/state was already requested, it will simply be ignored

                this._session.getStateSchedule.remove(rpc)

                break
            }
            case 'resend':
                this.log.debug(
                    'resend request %l (size = %d) failed because of %s',
                    msgId,
                    msgInfo.msgIds.length,
                    reason,
                )
                this._session.queuedResendReq.splice(0, 0, ...msgInfo.msgIds)
                this._flushTimer.emitWhenIdle()
                break
            case 'state':
                this.log.debug(
                    'state request %l (size = %d) failed because of %s',
                    msgId,
                    msgInfo.msgIds.length,
                    reason,
                )
                this._session.queuedStateReq.splice(0, 0, ...msgInfo.msgIds)
                this._flushTimer.emitWhenIdle()
                break
        }

        this._session.pendingMessages.delete(msgId)
    }

    private _resetLastPing(withTime = false): void {
        if (withTime) this._lastPingTime = 0

        if (!this._lastPingMsgId.isZero()) {
            this._session.pendingMessages.delete(this._lastPingMsgId)
        }

        this._lastPingMsgId = Long.ZERO
    }

    private _registerOutgoingMsgId(msgId: Long): Long {
        this._session.recentOutgoingMsgIds.add(msgId)
        return msgId
    }

    private _onPong({ msgId, pingId }: mtp.RawMt_pong): void {
        const info = this._session.pendingMessages.get(msgId)

        if (!info) {
            this.log.warn(
                'received pong to unknown ping (msg_id %l, ping_id %l)',
                msgId,
                pingId,
            )

            return
        }

        if (info._ !== 'ping') {
            this.log.warn(
                'received pong to %s query, not ping (msg_id %l, ping_id %l)',
                info._,
                msgId,
                pingId,
            )

            return
        }

        if (info.pingId.neq(pingId)) {
            this.log.warn(
                'received pong to %l, but expected ping_id = %l (got %l)',
                msgId,
                info.pingId,
                pingId,
            )
        }

        const rtt = Date.now() - this._lastPingTime
        this._lastPingRtt = rtt

        if (info.containerId.neq(msgId)) {
            this._onMessageAcked(info.containerId)
        }

        this.log.debug(
            'received pong: msg_id %l, ping_id %l, rtt = %dms',
            msgId,
            pingId,
            rtt,
        )
        this._resetLastPing()
    }

    private _onBadServerSalt(msg: mtp.RawMt_bad_server_salt): void {
        this._session.serverSalt = msg.newServerSalt

        this._onMessageFailed(msg.badMsgId, 'bad_server_salt')
    }

    private _onBadMsgNotification(
        msgId: Long,
        msg: mtp.RawMt_bad_msg_notification,
    ): void {
        switch (msg.errorCode) {
            case 16:
            case 17:
            case 20: {
                if (msg.errorCode !== 20) {
                    // msg_id is either too high or too low
                    // code 20 means msg_id is too old,
                    // we just need to resend the message
                    const serverTime = msgId.low >>> 0
                    const timeOffset =
                        Math.floor(Date.now() / 1000) - serverTime

                    this._session._timeOffset = timeOffset
                    this.log.debug(
                        'server time: %d, corrected offset to %d',
                        serverTime,
                        timeOffset,
                    )
                }

                this._onMessageFailed(
                    msg.badMsgId,
                    `bad_msg_notification ${msg.errorCode}`,
                )
                break
            }
            default:
                // something went very wrong, we need to reset the session
                this.log.error(
                    'received bad_msg_notification for msg_id = %l, code = %d. session will be reset',
                )
                this._resetSession()
                break
        }
    }

    private _onNewSessionCreated({
        firstMsgId,
        serverSalt,
        uniqueId,
    }: mtp.RawMt_new_session_created): void {
        if (uniqueId.eq(this._lastSessionCreatedUid)) {
            this.log.debug(
                'received new_session_created with the same uid = %l, ignoring',
                uniqueId,
            )

            return
        }

        if (
            !this._lastSessionCreatedUid.isZero() &&
            !this.params.disableUpdates
        ) {
            // force the client to fetch missed updates
            // when _lastSessionCreatedUid == 0, the connection has
            // just been established, and the client will fetch them anyways
            this.emit('update', { _: 'updatesTooLong' })
        }

        this._session.serverSalt = serverSalt

        this.log.debug(
            'received new_session_created, uid = %l, first msg_id = %l',
            uniqueId,
            firstMsgId,
        )

        for (const msgId of this._session.pendingMessages.keys()) {
            const val = this._session.pendingMessages.get(msgId)!

            if (val._ === 'container') {
                if (msgId.lt(firstMsgId)) {
                    // all messages in this container will be resent
                    // info about this container is no longer needed
                    this._session.pendingMessages.delete(msgId)
                }

                return
            }

            const containerId =
                val._ === 'rpc' ? val.rpc.containerId || msgId : val.containerId

            if (containerId.lt(firstMsgId)) {
                this._onMessageFailed(msgId, 'new_session_created', true)
            }
        }
    }

    private _onMessageInfo(
        msgId: Long,
        status: number,
        answerMsgId: Long,
    ): void {
        if (!msgId.isZero()) {
            const info = this._session.pendingMessages.get(msgId)
            if (!info) {
                this.log.info(
                    'received message info about unknown message %l',
                    msgId,
                )

                return
            }

            switch (status & 7) {
                case 1:
                case 2:
                case 3:
                    // message wasn't received by the server
                    this._onMessageFailed(msgId, `message info state ${status}`)
                    break

                case 0:
                    if (!answerMsgId.isZero()) {
                        this.log.warn(
                            'received message info with status = 0: msg_id = %l, status = %d, ans_id = %l',
                            msgId,
                            status,
                            answerMsgId,
                        )

                        return this._onMessageFailed(
                            msgId,
                            'message info state = 0, ans_id = 0',
                        )
                    }
                // fallthrough
                case 4:
                    this._onMessageAcked(msgId)
                    break
            }
        }

        if (
            !answerMsgId.isZero() &&
            !this._session.recentIncomingMsgIds.has(answerMsgId)
        ) {
            this.log.debug(
                'received message info for %l, but answer (%l) was not received yet',
                msgId,
                answerMsgId,
            )
            this._session.queuedResendReq.push(answerMsgId)
            this._flushTimer.emitWhenIdle()

            return
        }

        this.log.debug(
            'received message info for %l, and answer (%l) was already received',
            msgId,
            answerMsgId,
        )
    }

    private _onMessagesInfo(msgIds: Long[], info: Buffer): void {
        if (msgIds.length !== info.length) {
            this.log.warn(
                'messages state info was invalid: msg_ids.length !== info.length',
            )
        }

        for (let i = 0; i < msgIds.length; i++) {
            this._onMessageInfo(msgIds[i], info[i], Long.ZERO)
        }
    }

    private _onMsgsStateInfo(msg: mtp.RawMt_msgs_state_info): void {
        const info = this._session.pendingMessages.get(msg.reqMsgId)

        if (!info) {
            this.log.warn(
                'received msgs_state_info to unknown request %l',
                msg.reqMsgId,
            )

            return
        }

        if (info._ !== 'state') {
            this.log.warn(
                'received msgs_state_info to %s query %l',
                info._,
                msg.reqMsgId,
            )

            return
        }

        this._onMessagesInfo(info.msgIds, msg.info)
    }

    private _enqueueRpc(rpc: PendingRpc, force?: boolean) {
        if (this._session.enqueueRpc(rpc, force))
            this._flushTimer.emitWhenIdle()
    }

    _resetSession(): void {
        this._queuedDestroySession.push(this._session._sessionId)

        this._session.resetState(true)
        this.reconnect()

        // once we receive new_session_created, all pending messages will be resent.
        this._flushTimer.reset()
    }

    private _sendAck(msgId: Long): void {
        if (this._session.queuedAcks.length === 0) {
            this._flushTimer.emitBeforeNext(30000)
        }

        this._session.queuedAcks.push(msgId)

        if (this._session.queuedAcks.length >= 100) {
            this._flushTimer.emitNow()
        }
    }

    sendRpc<T extends tl.RpcMethod>(
        request: T,
        stack?: string,
        timeout?: number,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (this._usable && this.params.inactivityTimeout) {
            this._rescheduleInactivity()
        }

        if (!stack && this.params.niceStacks !== false) {
            stack = new Error().stack
        }

        const method = request._

        let obj: tl.TlObject = request
        let initConn = false

        if (this.params.disableUpdates) {
            obj = {
                _: 'invokeWithoutUpdates',
                query: obj,
            }
        }

        if (!this._session.initConnectionCalled) {
            // we will wrap every rpc call with initConnection
            // until some of the requests wrapped with it is
            // either acked or returns rpc_result

            this.log.debug(
                'wrapping %s with initConnection, layer: %d',
                method,
                this.params.layer,
            )
            obj = {
                _: 'invokeWithLayer',
                layer: this.params.layer,
                query: {
                    ...this.params.initConnection,
                    query: obj,
                },
            }
            initConn = true
        }

        this.log.verbose('>>> %j', obj)

        let content = TlBinaryWriter.serializeObject(this._writerMap, obj)

        if (content.length > 1044404) {
            // if you send larger payloads, telegram will just close connection,
            // and since we resend them, it will get resent after reconnection and
            // that will be an endless loop of reconnections. we don't want that,
            // and payloads this large are usually a sign of an error in the code.
            throw new Error(`Payload is too big (${content.length} > 1044404)`)
        }

        // gzip
        let shouldGzip = content.length > 128

        if (content.length > 16384) {
            // test compression ratio for the middle part
            // if it is less than 0.9, then try to compress the whole request

            const middle = ~~((content.length - 1024) / 2)
            const gzipped = gzipDeflate(
                content.slice(middle, middle + 1024),
                0.9,
            )

            if (!gzipped) shouldGzip = false
        }

        if (shouldGzip) {
            const gzipped = gzipDeflate(content, 0.9)

            if (gzipped) {
                this.log.debug(
                    'gzipped %s (%db -> %db)',
                    method,
                    content.length,
                    gzipped.length,
                )

                content = gzipped
            } else {
                shouldGzip = false
            }
        }

        const pending: PendingRpc = {
            method,
            promise: undefined as any, // because we need the object to make a promise
            data: content,
            stack,
            // we will need to know size of gzip_packed overhead in _flush()
            gzipOverhead: shouldGzip ?
                4 + TlSerializationCounter.countBytesOverhead(content.length) :
                0,
            initConn,

            // setting them as well so jit can optimize stuff
            sent: undefined,
            getState: undefined,
            msgId: undefined,
            seqNo: undefined,
            containerId: undefined,
            acked: undefined,
            cancelled: undefined,
            timeout: undefined,
        }

        const promise = createCancellablePromise<any>(
            this._cancelRpc.bind(this, pending),
        )
        pending.promise = promise

        if (timeout) {
            pending.timeout = setTimeout(
                this._cancelRpc,
                timeout,
                pending,
                true,
            )
        }

        this._enqueueRpc(pending, true)

        return promise
    }

    private _cancelRpc(rpc: PendingRpc, onTimeout = false): void {
        if (rpc.cancelled && !onTimeout) {
            throw new Error('RPC was already cancelled')
        }

        if (!onTimeout && rpc.timeout) {
            clearTimeout(rpc.timeout)
        }

        if (onTimeout) {
            const error = new tl.errors.RpcTimeoutError()

            if (this.params.niceStacks !== false) {
                makeNiceStack(error, rpc.stack!, rpc.method)
            }

            rpc.promise.reject(error)
        }

        rpc.cancelled = true

        if (rpc.msgId) {
            this._session.queuedCancelReq.push(rpc.msgId)
            this._flushTimer.emitWhenIdle()
        } else {
            // in case rpc wasn't sent yet (or had some error),
            // we can simply remove it from queue
            this._session.queuedRpc.remove(rpc)
        }
    }

    private _flush(): void {
        if (!this._session._authKey.ready || this._current429Timeout) {
            // it will be flushed once connection is usable
            return
        }

        try {
            this._doFlush()
        } catch (e: any) {
            this.log.error('flush error: %s', e.stack)
            // should not happen unless there's a bug in the code
        }

        // schedule next flush
        // if there are more queued requests, flush immediately
        // (they likely didn't fit into one message)
        if (
            this._session.queuedRpc.length ||
            this._session.queuedAcks.length ||
            this._session.queuedStateReq.length ||
            this._session.queuedResendReq.length
        ) {
            this._flush()
        } else {
            this._flushTimer.emitBefore(this._lastPingTime + 60000)
        }
    }

    private _doFlush(): void {
        this.log.debug(
            'flushing send queue. queued rpc: %d',
            this._session.queuedRpc.length
        )

        // oh bloody hell mate

        // total size & count
        let packetSize = 0
        let messageCount = 0
        // size & msg count that count towards container limit
        // these will be added to total later
        let containerMessageCount = 0
        let containerSize = 0

        let ackRequest: Buffer | null = null
        let ackMsgIds: Long[] | null = null

        let pingRequest: Buffer | null = null
        let pingId: Long | null = null
        let pingMsgId: Long | null = null

        let getStateRequest: Buffer | null = null
        let getStateMsgId: Long | null = null
        let getStateMsgIds: Long[] | null = null

        let resendRequest: Buffer | null = null
        let resendMsgId: Long | null = null
        let resendMsgIds: Long[] | null = null

        let cancelRpcs: Long[] | null = null
        let destroySessions: Long[] | null = null

        const now = Date.now()

        if (this._session.queuedAcks.length) {
            let acks = this._session.queuedAcks
            if (acks.length > 8192) {
                this._session.queuedAcks = acks.slice(8192)
                acks = acks.slice(0, 8192)
            } else {
                this._session.queuedAcks = []
            }

            const obj: mtp.RawMt_msgs_ack = {
                _: 'mt_msgs_ack',
                msgIds: acks,
            }
            ackMsgIds = obj.msgIds

            ackRequest = TlBinaryWriter.serializeObject(this._writerMap, obj)
            packetSize += ackRequest.length + 16
            messageCount += 1
        }

        const getStateTime = now + 1500

        if (now - this._lastPingTime > 60000) {
            if (!this._lastPingMsgId.isZero()) {
                this.log.warn(
                    "didn't receive pong for previous ping (msg_id = %l)",
                    this._lastPingMsgId,
                )
                this._session.pendingMessages.delete(this._lastPingMsgId)
            }

            pingId = randomLong()
            const obj: mtp.RawMt_ping = {
                _: 'mt_ping',
                pingId,
            }

            this._lastPingTime = Date.now()

            pingRequest = TlBinaryWriter.serializeObject(this._writerMap, obj)
            containerSize += pingRequest.length + 16
            containerMessageCount += 1
        }

        {
            if (this._session.queuedStateReq.length) {
                let ids = this._session.queuedStateReq
                if (ids.length > 8192) {
                    this._session.queuedStateReq = ids.slice(8192)
                    ids = ids.slice(0, 8192)
                } else {
                    this._session.queuedStateReq = []
                }
                getStateMsgIds = ids
            }

            const idx = this._session.getStateSchedule.index(
                { getState: now } as any,
                true,
            )

            if (idx > 0) {
                const toGetState = this._session.getStateSchedule.raw.splice(
                    0,
                    idx
                )
                if (!getStateMsgIds) getStateMsgIds = []
                toGetState.forEach((it) => getStateMsgIds!.push(it.msgId!))
            }

            if (getStateMsgIds) {
                const obj: mtp.RawMt_msgs_state_req = {
                    _: 'mt_msgs_state_req',
                    msgIds: getStateMsgIds,
                }

                getStateRequest = TlBinaryWriter.serializeObject(
                    this._writerMap,
                    obj,
                )
                packetSize += getStateRequest.length + 16
                messageCount += 1
            }
        }

        if (this._session.queuedResendReq.length) {
            resendMsgIds = this._session.queuedResendReq
            if (resendMsgIds.length > 8192) {
                this._session.queuedResendReq = resendMsgIds.slice(8192)
                resendMsgIds = resendMsgIds.slice(0, 8192)
            } else {
                this._session.queuedResendReq = []
            }

            const obj: mtp.RawMt_msg_resend_req = {
                _: 'mt_msg_resend_req',
                msgIds: resendMsgIds,
            }

            resendRequest = TlBinaryWriter.serializeObject(this._writerMap, obj)
            packetSize += resendRequest.length + 16
            messageCount += 1
        }

        if (this._session.queuedCancelReq.length) {
            containerMessageCount += this._session.queuedCancelReq.length
            containerSize += this._session.queuedCancelReq.length * 28
            cancelRpcs = this._session.queuedCancelReq
            this._session.queuedCancelReq = []
        }

        if (this._queuedDestroySession.length) {
            containerMessageCount += this._session.queuedCancelReq.length
            containerSize += this._session.queuedCancelReq.length * 28
            destroySessions = this._queuedDestroySession
            this._queuedDestroySession = []
        }

        let forceContainer = false
        const rpcToSend: PendingRpc[] = []

        while (
            this._session.queuedRpc.length &&
            containerSize < 32768 && // 2^15
            containerMessageCount < 1020
        ) {
            const msg = this._session.queuedRpc.popFront()!
            if (msg.cancelled) continue

            // note: we don't check for <2^15 here
            // this is not documented, but large requests
            // (like upload.saveFilePart) *may* exceed that limit

            rpcToSend.push(msg)
            containerSize += msg.data.length + 16
            if (msg.gzipOverhead) containerSize += msg.gzipOverhead

            // if message was already assigned a msg_id,
            // we must wrap it in a container with a newer msg_id
            if (msg.msgId) forceContainer = true
        }

        packetSize += containerSize
        messageCount += containerMessageCount + rpcToSend.length

        if (!messageCount) {
            this.log.debug('flush failed: nothing to flush')

            return
        }

        const useContainer = forceContainer || messageCount > 1
        if (useContainer) packetSize += 24 // 8 (msg_container) + 16 (mtproto header)

        const writer = TlBinaryWriter.alloc(this._writerMap, packetSize)

        if (useContainer) {
            // leave bytes for mtproto header (we'll write it later,
            // since we need seqno and msg_id to be larger than the content)
            writer.pos += 16
            writer.uint(0x73f1f8dc) // msg_container
            writer.uint(messageCount)
        }

        const otherPendings: Exclude<
            PendingMessage,
            { _: 'rpc' | 'container' }
        >[] = []

        if (ackRequest) {
            this._registerOutgoingMsgId(
                this._session.writeMessage(writer, ackRequest),
            )
        }

        if (pingRequest) {
            pingMsgId = this._registerOutgoingMsgId(
                this._session.writeMessage(writer, pingRequest),
            )
            this._lastPingMsgId = pingMsgId
            const pingPending: PendingMessage = {
                _: 'ping',
                pingId: pingId!,
                containerId: pingMsgId,
            }
            this._session.pendingMessages.set(pingMsgId, pingPending)
            otherPendings.push(pingPending)
        }

        if (getStateRequest) {
            getStateMsgId = this._registerOutgoingMsgId(
                this._session.writeMessage(writer, getStateRequest),
            )
            const getStatePending: PendingMessage = {
                _: 'state',
                msgIds: getStateMsgIds!,
                containerId: getStateMsgId,
            }
            this._session.pendingMessages.set(getStateMsgId, getStatePending)
            otherPendings.push(getStatePending)
        }

        if (resendRequest) {
            resendMsgId = this._registerOutgoingMsgId(
                this._session.writeMessage(writer, resendRequest),
            )
            const resendPending: PendingMessage = {
                _: 'resend',
                msgIds: resendMsgIds!,
                containerId: resendMsgId,
            }
            this._session.pendingMessages.set(resendMsgId, resendPending)
            otherPendings.push(resendPending)
        }

        if (cancelRpcs) {
            cancelRpcs.forEach((msgId) => {
                const cancelMsgId = this._registerOutgoingMsgId(
                    this._session.writeMessage(writer, {
                        _: 'mt_rpc_drop_answer',
                        reqMsgId: msgId,
                    }),
                )

                const pending: PendingMessage = {
                    _: 'cancel',
                    msgId,
                    containerId: cancelMsgId,
                }
                this._session.pendingMessages.set(cancelMsgId, pending)
                otherPendings.push(pending)
            })
        }

        if (destroySessions) {
            destroySessions.forEach((sessionId) => {
                const msgId = this._registerOutgoingMsgId(
                    this._session.writeMessage(writer, {
                        _: 'mt_destroy_session',
                        sessionId,
                    }),
                )

                const pending: PendingMessage = {
                    _: 'destroy_session',
                    sessionId,
                    containerId: msgId,
                }
                this._session.pendingMessages.set(msgId, pending)
                otherPendings.push(pending)
            })
        }

        for (let i = 0; i < rpcToSend.length; i++) {
            const msg = rpcToSend[i]
            // not using writeMessage here because we also need seqNo, and
            // i dont want to also return seqNo there because that would mean
            // extra object overhead

            if (!msg.msgId) {
                const msgId = this._session.getMessageId()
                const seqNo = this._session.getSeqNo()

                this.log.debug(
                    '%s: msg_id assigned %l, seqno: %d',
                    msg.method,
                    msgId,
                    seqNo,
                )

                msg.msgId = msgId
                msg.seqNo = seqNo
                this._session.pendingMessages.set(msgId, {
                    _: 'rpc',
                    rpc: msg,
                })
            } else {
                this.log.debug(
                    '%s: msg_id already assigned, reusing %l, seqno: %d',
                    msg.method,
                    msg.msgId,
                    msg.seqNo,
                )
            }

            // (re-)schedule get_state if needed
            if (msg.getState) {
                this._session.getStateSchedule.remove(msg)
            }
            if (!msg.acked) {
                msg.getState = getStateTime
                this._session.getStateSchedule.insert(msg)
            }

            writer.long(this._registerOutgoingMsgId(msg.msgId))
            writer.uint(msg.seqNo!)

            if (msg.gzipOverhead) {
                writer.uint(msg.data.length + msg.gzipOverhead)
                writer.uint(0x3072cfa1) // gzip_packed#3072cfa1
                writer.bytes(msg.data)
            } else {
                writer.uint(msg.data.length)
                writer.raw(msg.data)
            }

            msg.sent = true
        }

        if (useContainer) {
            // we now need to assign the container msg_id and seqno
            // we couldn't have assigned them earlier because mtproto
            // requires them to be >= than the contained messages

            // writer.pos is expected to be packetSize

            const containerId = this._session.getMessageId()
            writer.pos = 0
            writer.long(this._registerOutgoingMsgId(containerId))
            writer.uint(this._session.getSeqNo(false))
            writer.uint(packetSize - 16)
            writer.pos = packetSize

            const msgIds = []

            for (let i = 0; i < rpcToSend.length; i++) {
                const msg = rpcToSend[i]
                msg.containerId = containerId
                msgIds.push(msg.msgId!)
            }

            if (otherPendings.length) {
                otherPendings.forEach((msg) => {
                    msgIds.push(msg.containerId)
                    msg.containerId = containerId
                })
            }

            this._session.pendingMessages.set(containerId, {
                _: 'container',
                msgIds,
            })
        }

        const result = writer.result()
        // probably the easiest way lol
        const rootMsgId = new Long(result.readInt32LE(), result.readInt32LE(4))

        this.log.debug(
            'sending %d messages: size = %db, acks = %d (msg_id = %s), ping = %s (msg_id = %s), state_req = %s (msg_id = %s), resend = %s (msg_id = %s), rpc = %s, container = %s, root msg_id = %l',
            messageCount,
            packetSize,
            ackMsgIds?.length || 'false',
            ackMsgIds?.map((it) => it.toString()),
            Boolean(pingRequest),
            pingMsgId,
            getStateMsgIds?.map((it) => it.toString()) || 'false',
            getStateMsgId,
            resendMsgIds?.map((it) => it.toString()) || 'false',
            resendMsgId,
            rpcToSend.map((it) => it.method),
            useContainer,
            rootMsgId,
        )

        this._session._authKey
            .encryptMessage(
                result,
                this._session.serverSalt,
                this._session._sessionId
            )
            .then((enc) => this.send(enc))
            .catch((err) => {
                this.log.error(
                    'error while sending pending messages (root msg_id = %l): %s',
                    rootMsgId,
                    err.stack,
                )

                // put acks in the front so they are the first to be sent
                if (ackMsgIds)
                    this._session.queuedAcks.splice(0, 0, ...ackMsgIds)
                this._onMessageFailed(rootMsgId, 'unknown error')
            })
    }
}
