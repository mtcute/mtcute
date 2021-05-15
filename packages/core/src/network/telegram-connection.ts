import {
    PersistentConnection,
    PersistentConnectionParams,
} from './persistent-connection'
import { TransportError } from './transports'
import { tl } from '@mtcute/tl'
import { doAuthorization } from './authorization'
import { MtprotoSession } from './mtproto-session'
import { BinaryWriter } from '../utils/binary/binary-writer'
import bigInt, { BigInteger } from 'big-integer'
import { getRandomInt } from '../utils/misc-utils'
import {
    ControllablePromise,
    createControllablePromise,
} from '../utils/controllable-promise'
import { debounce } from '../utils/function-utils'
import { bufferToBigInt, ulongToLong } from '../utils/bigint-utils'
import { randomBytes } from '../utils/buffer-utils'
import { BadRequestError, createRpcErrorFromTl, RpcError, RpcTimeoutError, TimeoutError } from '@mtcute/tl/errors'
import { LruStringSet } from '../utils/lru-string-set'

function makeNiceStack(error: RpcError, stack: string, method?: string) {
    error.stack = `${error.constructor.name} (${error.code} ${
        error.text
    }): ${error.message}\n    at ${
        method
    }\n${stack.split('\n').slice(2).join('\n')}`
}

const _debug = require('debug')
const debug = _debug('mtcute:conn')

// hex formatting buffers with %h
_debug.formatters.h = (v: Buffer): string => v.toString('hex')
// true/false formatting with %b
_debug.formatters.b = (v: any): string => !!v + ''

export interface TelegramConnectionParams extends PersistentConnectionParams {
    initConnection: tl.RawInitConnectionRequest
    inactivityTimeout?: number
    niceStacks?: boolean
}

const messageHandlers: Record<string, string /* keyof TelegramConnection */> = {
    // because keyof does not return private fields :shrug:

    mt_rpc_result: '_handleRpcResult',
    mt_msg_container: '_handleContainer',
    mt_pong: '_handlePong',
    mt_bad_server_salt: '_handleBadServerSalt',
    mt_bad_msg_notification: '_handleBadMsgNotification',
    mt_msgs_ack: '_handleAcks',
    mt_new_session_created: '_handleNewSessionCreated',
    mt_msg_detailed_info: '_handleDetailedInfo',
    mt_msg_new_detailed_info: '_handleNewDetailedInfo',
    mt_future_salts: '_handleFutureSalts',
    mt_msg_state_req: '_handleStateForgotten',
    mt_msg_resend_req: '_handleStateForgotten',
}

interface PendingMessage {
    // name of the method which is being called
    method: string
    stack?: string
    promise: ControllablePromise
    message: Buffer
    // timeout after which the call will be cancelled
    cancel?: NodeJS.Timeout
}

// TODO: error handling basically everywhere, most importantly (de-)serialization errors
// noinspection JSUnusedLocalSymbols
export class TelegramConnection extends PersistentConnection {
    readonly params: TelegramConnectionParams

    private readonly _mtproto: MtprotoSession

    private _timeOffset = 0
    private _lastMessageId = bigInt.zero
    private _seqNo = 0

    _initConnectionCalled = false
    private _initConnectionPromise?: Promise<void>

    // set of messages to be sent once there's a usable connection
    private _sendOnceUsable: PendingMessage[] = []
    // currently active rpc calls. TODO: somehow handle resending? mtproto really does stink
    private _pendingRpcCalls: Record<string, PendingMessage> = {}

    private _pendingAcks: BigInteger[] = []
    private _pingInterval: NodeJS.Timeout | null = null
    private _pendingPing: BigInteger | null = null
    private _pendingPingMsgId: BigInteger | null = null

    private _recentUpdateMsgIds = new LruStringSet(100)

    authKey: Buffer | null = null

    private _sendPendingAcks = debounce(async () => {
        if (this._destroyed) return
        if (!this._pendingAcks.length) return
        if (!this._mtproto.authorized) return this._sendPendingAcks() // reschedule

        await this.sendEncryptedMessage({
            _: 'mt_msgs_ack',
            msgIds: this._pendingAcks,
        })
        this._pendingAcks = []
    }, 500)

    constructor(params: TelegramConnectionParams) {
        super(params)
        this._mtproto = new MtprotoSession(this.params.crypto)
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
        this._pendingAcks = []
        if (this._pingInterval) clearInterval(this._pingInterval)
        this._pingInterval = null
        this._pendingPing = null
        this._lastMessageId = bigInt.zero
        this._seqNo = 0
        this._initConnectionCalled = false

        if (forever) {
            // if connection will be used later (i.e. resetting for reconnection),
            // there's no need to cancel pending rpc calls
            // (and even the opposite, we want them to be sent once connected)
            ;[
                ...Object.values(this._pendingRpcCalls),
                ...this._sendOnceUsable,
            ].forEach((it) =>
                it.promise.reject(new Error('Connection destroyed'))
            )
            this._mtproto.reset()
        }
    }

    changeDc(dc: tl.RawDcOption): void {
        this._mtproto.reset()
        this.authKey = null
        this.params.dc = dc
        this.reconnect()
    }

    protected onError(error: Error): void {
        // https://core.telegram.org/mtproto/mtproto-_transports#_transport-errors
        if (error instanceof TransportError) {
            debug('transport error %d (dc %d)', error.code, this.params.dc.id)
            if (error.code === 404) {
                this._mtproto.reset()
                this.emit('key-change', null)
                this._authorize()
                return
            }
        }
        this.emit('error', error)
    }

    protected async onConnected(): Promise<void> {
        if (this.authKey) {
            await this._mtproto.setupKeys(this.authKey)

            this.onConnectionUsable()
        } else {
            this._authorize()
        }
    }

    protected onConnectionUsable(): void {
        super.onConnectionUsable()

        const sendOnceUsable = this._sendOnceUsable
        // this way in case connection is still invalid (somehow??) messages aren't lost
        this._sendOnceUsable = []
        sendOnceUsable.forEach((it) => this._resend(it))

        Object.entries(this._pendingRpcCalls).forEach(([id, it]) => this._resend(it, id))

        this._pingInterval = setInterval(() => {
            if (this._pendingPing === null) {
                this._pendingPing = ulongToLong(
                    bufferToBigInt(randomBytes(8), 0, 8, true)
                )
                this.sendEncryptedMessage(
                    { _: 'mt_ping', pingId: this._pendingPing },
                    false
                )
                    .then((id) => {
                        this._pendingPingMsgId = id
                    })
                    .catch((err) => this.emit('error', err))
            } else {
                // connection is dead, thank you durov
                this.reconnect()
            }
        }, 60_000)
    }

    protected async onMessage(data: Buffer): Promise<void> {
        if (!this._mtproto) {
            // if a message is received before authorization,
            // either the server is misbehaving,
            // or there was a problem with authorization.
            debug('warn: received message before authorization')
            return
        }

        try {
            const message = await this._mtproto.decryptMessage(data)
            if (!message) return

            await this._handleMessage(message.content, message.messageId)
        } catch (err) {
            this.emit('error', err)
        }
    }

    private _sendAckLater(id: BigInteger) {
        this._pendingAcks.push(id)
        this._sendPendingAcks()
    }

    private _resend(it: PendingMessage, id?: string): void {
        debug('resending %s', it.method)
        this._sendBufferForResult(it).catch(it.promise.reject)
        if (id) delete this._pendingRpcCalls[id]
    }

    private _authorize(): void {
        doAuthorization(this, this.params.crypto)
            .then(async ([authKey, serverSalt, timeOffset]) => {
                await this._mtproto.setupKeys(authKey)
                this._mtproto.serverSalt = serverSalt
                this._timeOffset = timeOffset
                this.authKey = authKey

                this.emit('key-change', authKey)

                this.onConnectionUsable()
            })
            .catch((err) => {
                debug('Authorization error: %s', err.message)
                this.onError(err)
                this.reconnect()
            })
    }

    private async _handleMessage(
        message: tl.TlObject,
        messageId: BigInteger
    ): Promise<void> {
        if (messageId.isEven()) {
            debug(
                'warn: ignoring message with invalid messageId = %s (is even)',
                messageId
            )
            return
        }

        this._sendAckLater(messageId)

        if (message._ in messageHandlers) {
            await (this as any)[messageHandlers[message._]](message, messageId)
            return
        }

        if (tl.isAnyUpdates(message)) {
            if (this._usable && this.params.inactivityTimeout)
                this._rescheduleInactivity()

            this._recentUpdateMsgIds.add(messageId.toString(16))
            this.emit('update', message)
            return
        }

        debug('unknown message received: %o', message)
    }

    private _handleContainer(message: tl.mtproto.RawMsg_container): void {
        message.messages.forEach((msg) =>
            this._handleMessage(msg.body, msg.msgId)
        )
    }

    private _handleRpcResult(message: tl.mtproto.RawRpc_result): void {
        if (this._usable && this.params.inactivityTimeout)
            this._rescheduleInactivity()

        const reqMsgId = message.reqMsgId.toString(16)
        const pending = this._pendingRpcCalls[reqMsgId]
        if (!pending) {
            debug('received rpc result for unknown message %s', reqMsgId)
            return
        }
        debug('handling rpc result for %s (%s)', reqMsgId, pending.method)

        if (message.result._ === 'mt_rpc_error') {
            const error = createRpcErrorFromTl(message.result)
            if (this.params.niceStacks !== false) {
                makeNiceStack(error, pending.stack!, pending.method)
            }
            pending.promise.reject(error)
        } else {
            if (pending.cancel) clearTimeout(pending.cancel)
            pending.promise.resolve(message.result)
        }

        delete this._pendingRpcCalls[reqMsgId]
    }

    private _handlePong(message: tl.mtproto.RawPong): void {
        const msgId = message.msgId.toString(16)

        debug('handling pong for %s (ping id %s)', msgId, message.pingId)

        if (this._pendingPing && message.pingId.eq(this._pendingPing)) {
            this._pendingPing = null
            this._pendingPingMsgId = null
            return
        }

        if (this._pendingRpcCalls[msgId]) {
            const pending = this._pendingRpcCalls[msgId]
            if (pending.cancel) clearTimeout(pending.cancel)

            pending.promise.resolve(message)
            delete this._pendingRpcCalls[msgId]
        } else {
            debug('pong to unknown ping %o', message)
        }
    }

    private async _handleBadServerSalt(
        message: tl.mtproto.RawBad_server_salt
    ): Promise<void> {
        const badMsgId = message.badMsgId.toString(16)

        debug(
            'handling bad_server_salt for msg %s, new salt: %h',
            badMsgId,
            message.newServerSalt
        )

        this._mtproto.serverSalt = message.newServerSalt

        if (this._pendingRpcCalls[badMsgId]) {
            this._resend(this._pendingRpcCalls[badMsgId], badMsgId)
        } else if (
            this._pendingPingMsgId &&
            this._pendingPingMsgId.eq(message.badMsgId)
        ) {
            // acknowledge the ping was received.
            // no need to re-send it
            this._pendingPing = null
            this._pendingPingMsgId = null
        } else {
            debug('bad_server_salt to unknown message %o', message)
        }
    }

    private async _handleBadMsgNotification(
        message: tl.mtproto.RawBad_msg_notification,
        messageId: BigInteger
    ): Promise<void> {
        const badMsgId = message.badMsgId.toString(16)

        debug('handling bad_msg_notification, code: %d', message.errorCode)

        if (message.errorCode === 16 || message.errorCode === 17) {
            // msg_id is either too high or too low
            const serverTime = bigInt(messageId).shiftRight(32).toJSNumber()
            this._timeOffset = Math.floor(Date.now() / 1000) - serverTime
        } else if (message.errorCode === 32) {
            // meg_seqno is too low, so, like telethon, __just pump it up by some "large" amount__
            this._seqNo += 64
        } else if (message.errorCode === 33) {
            // does not seem to happen, but whatever
            this._seqNo -= 16
        } else if (this._pendingRpcCalls[badMsgId]) {
            const pending = this._pendingRpcCalls[badMsgId]

            const error = new BadRequestError(
                'BAD_REQUEST',
                'bad_msg_notification ' + message.errorCode
            )
            if (this.params.niceStacks !== false) {
                makeNiceStack(error, pending.stack!, pending.method)
            }
            pending.promise.reject(error)
            delete this._pendingRpcCalls[badMsgId]
            return
        }

        if (this._pendingRpcCalls[badMsgId]) {
            this._resend(this._pendingRpcCalls[badMsgId], badMsgId)
        } else {
            debug('bad_msg_notification to unknown message %s', badMsgId)
        }
    }

    private _handleAcks(message: tl.mtproto.RawMsgs_ack) {
        // according to telethon, we should only care about acks to auth.logOut.
        message.msgIds.forEach((idLong) => {
            const id = idLong.toString(16)
            if (this._pendingRpcCalls[id]?.method === 'auth.logOut') {
                const pending = this._pendingRpcCalls[id]
                if (pending.cancel) clearTimeout(pending.cancel)

                pending.promise.resolve(true)
                delete this._pendingRpcCalls[id]
            }
        })
    }

    private _handleNewSessionCreated(
        message: tl.mtproto.RawNew_session_created
    ): void {
        const firstMsgId = message.firstMsgId
        const firstMsgIdStr = firstMsgId.toString(16)

        for (const [msgId, info] of Object.entries(this._pendingRpcCalls)) {
            if (
                // almost always true. integers of the same string length
                // can be compared alphanumerically, without the need to parse
                // the integer from the string
                (msgId.length === firstMsgIdStr.length &&
                    msgId > firstMsgIdStr) ||
                firstMsgId.lt(bigInt(msgId, 16))
            ) {
                this._resend(info, msgId)
            }
        }

        debug(
            'handling new_session_created (sid = %h), salt: %h',
            this._mtproto._sessionId,
            message.serverSalt
        )
        this._mtproto.serverSalt = message.serverSalt
    }

    private _handleDetailedInfo(
        message: tl.mtproto.RawMsg_detailed_info
    ): void {
        debug(
            'handling msg_detailed_info (sid = %h), msgId = %s',
            this._mtproto._sessionId,
            message.answerMsgId
        )

        const msgId = message.msgId.toString(16)
        if (!(msgId in this._pendingRpcCalls)) {
            // received
            this._sendAckLater(message.answerMsgId)
        } else {
            // not received, request the response
            this.sendEncryptedMessage({
                _: 'mt_msg_resend_req',
                msgIds: [message.answerMsgId],
            }).catch(() => {
                /* no-op */
            })
        }
    }

    private _handleNewDetailedInfo(
        message: tl.mtproto.RawMsg_new_detailed_info
    ): void {
        debug(
            'handling msg_new_detailed_info (sid = %h), msgId = %s',
            this._mtproto._sessionId,
            message.answerMsgId
        )

        const received = this._recentUpdateMsgIds.has(
            message.answerMsgId.toString(16)
        )
        if (received) {
            this._sendAckLater(message.answerMsgId)
        } else {
            this.sendEncryptedMessage({
                _: 'mt_msg_resend_req',
                msgIds: [message.answerMsgId],
            }).catch(() => {
                /* no-op */
            })
        }
    }

    private _handleFutureSalts(message: tl.mtproto.RawFuture_salts): void {
        // TODO actually handle these salts
        debug(
            'handling future_salts (sid = %h), msgId = %s, %d salts',
            this._mtproto._sessionId,
            message.reqMsgId,
            message.salts.length
        )

        const reqMsgId = message.reqMsgId.toString(16)

        if (reqMsgId in this._pendingRpcCalls) {
            const pending = this._pendingRpcCalls[reqMsgId]
            if (pending.cancel) clearTimeout(pending.cancel)

            pending.promise.resolve(message)
        }
    }

    private _handleStateForgotten(
        message: tl.mtproto.RawMsgs_state_req | tl.mtproto.RawMsg_resend_req,
        messageId: BigInteger
    ): void {
        const info = Buffer.alloc(message.msgIds.length)
        for (let i = 0; i < info.length; i++) {
            info[i] = 0x01
        }

        this.sendEncryptedMessage({
            _: 'mt_msgs_state_info',
            reqMsgId: messageId,
            info,
        }).catch(() => {
            /* no-op */
        })
    }

    async sendEncryptedMessage(
        message: tl.TlObject | Buffer,
        isContentRelated = true
    ): Promise<BigInteger> {
        if (!this._mtproto.authorized) throw new Error('Keys are not set up!')

        const messageId = this._getMessageId()
        const seqNo = this._getSeqNo(isContentRelated)

        const encrypted = await this._mtproto.encryptMessage(
            message,
            messageId,
            seqNo
        )
        await this.send(encrypted)

        return messageId
    }

    async _sendBufferForResult(message: PendingMessage): Promise<tl.TlObject>
    async _sendBufferForResult(
        method: string,
        message: Buffer,
        stack?: string,
        timeout?: number,
    ): Promise<tl.TlObject>
    async _sendBufferForResult(
        method: string | PendingMessage,
        message?: Buffer,
        stack?: string,
        timeout?: number,
    ): Promise<tl.TlObject> {
        if (typeof method === 'string' && this.params.niceStacks !== false && !stack) {
            stack = new Error().stack
        }

        const content = typeof method === 'string' ? message! : method.message
        if (content.length > 1044404) {
            // if you send larger payloads, telegram will just close connection,
            // and since we resend them, it will get resent after reconnection and
            // that will be an endless loop of reconnections. we don't want that,
            // and payloads this large are usually a sign of an error in the code.
            const err = new Error(`Payload is too big (${content.length} > 1044404)`)
            if (typeof method === 'string') {
                throw err
            } else {
                // shouldn't happen, but whatever
                method.promise.reject(err)
            }
        }

        const promise =
            typeof method === 'string'
                ? createControllablePromise()
                : method.promise

        const pending =
            typeof method === 'string'
                ? { method, promise, message: message!, stack }
                : method

        if (!this._mtproto.authorized) {
            this._sendOnceUsable.push(pending)
            return promise
        }

        const messageId = this._getMessageId()
        const messageIdStr = messageId.toString(16)
        const seqNo = this._getSeqNo(true)

        this._pendingRpcCalls[messageIdStr] = pending

        if (timeout) {
            pending.cancel = setTimeout(() => {
                const pending = this._pendingRpcCalls[messageIdStr]
                if (pending) {
                    const error = new RpcTimeoutError(timeout)
                    if (this.params.niceStacks !== false) {
                        makeNiceStack(error, pending.stack!, pending.method)
                    }

                    pending.promise.reject(error)
                    delete this._pendingRpcCalls[messageIdStr]
                }
            }, timeout)
        }

        const encrypted = await this._mtproto.encryptMessage(
            content,
            messageId,
            seqNo
        )
        await this.send(encrypted)

        return promise
    }

    async sendForResult<T extends tl.RpcMethod>(
        message: T,
        stack?: string,
        timeout?: number,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (this._usable && this.params.inactivityTimeout)
            this._rescheduleInactivity()

        debug('making rpc call %s', message._)

        let obj: tl.TlObject = message
        if (!this._initConnectionCalled) {
            debug('wrapping %s with initConnection', message._)
            obj = {
                _: 'invokeWithLayer',
                layer: tl.CURRENT_LAYER,
                query: {
                    ...this.params.initConnection,
                    query: message,
                },
            } as tl.RawInvokeWithLayerRequest
            this._initConnectionCalled = true

            // initConnection must be the first rpc call at all times
            // to ensure that we store the promise for the initConnection call
            // and wait until it resolves before sending any other calls.

            const ret = this._sendBufferForResult(
                message._,
                BinaryWriter.serializeObject(obj),
                stack
            )

            this._initConnectionPromise = ret
                .catch(() => {})
                .then(() => {
                    this._initConnectionPromise = undefined
                })

            return ret
        }

        if (this._initConnectionPromise) {
            await this._initConnectionPromise
        }

        return this._sendBufferForResult(
            message._,
            BinaryWriter.serializeObject(obj),
            stack,
            timeout
        )
    }

    private _getMessageId(): BigInteger {
        const timeTicks = Date.now()
        const timeSec = Math.floor(timeTicks / 1000) + this._timeOffset
        const timeMSec = timeTicks % 1000
        const random = getRandomInt(0xffff)

        let messageId = bigInt(timeSec)
            .shiftLeft(32)
            .add(
                bigInt(timeMSec)
                    .shiftLeft(21)
                    .or(random << 3)
                    .or(4)
            )

        if (this._lastMessageId.gt(messageId)) {
            messageId = this._lastMessageId.plus(4)
        }

        this._lastMessageId = messageId

        return messageId
    }

    private _getSeqNo(isContentRelated = true): number {
        let seqNo = this._seqNo * 2

        if (isContentRelated) {
            seqNo += 1
            this._seqNo += 1
        }

        return seqNo
    }
}
