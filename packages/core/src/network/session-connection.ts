/* eslint-disable @typescript-eslint/no-explicit-any */
// will be reworked in MTQ-32
import Long from 'long'

import { mtp, tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter, TlReaderMap, TlSerializationCounter, TlWriterMap } from '@mtcute/tl-runtime'

import { getPlatform } from '../platform.js'
import { MtArgumentError, MtcuteError, MtTimeoutError } from '../types/index.js'
import { createAesIgeForMessageOld } from '../utils/crypto/mtproto.js'
import { reportUnknownError } from '../utils/error-reporting.js'
import {
    concatBuffers,
    ControllablePromise,
    createControllablePromise,
    EarlyTimer,
    ICryptoProvider,
    longFromBuffer,
    randomLong,
    removeFromLongArray,
} from '../utils/index.js'
import { doAuthorization } from './authorization.js'
import { MtprotoSession, PendingMessage, PendingRpc } from './mtproto-session.js'
import { PersistentConnection, PersistentConnectionParams } from './persistent-connection.js'
import { ServerSaltManager } from './server-salt.js'
import { TransportError } from './transports/abstract.js'

export interface SessionConnectionParams extends PersistentConnectionParams {
    initConnection: tl.RawInitConnectionRequest
    inactivityTimeout?: number
    niceStacks?: boolean
    enableErrorReporting: boolean
    layer: number
    disableUpdates?: boolean
    withUpdates?: boolean
    isMainConnection: boolean
    isMainDcConnection: boolean
    usePfs?: boolean

    salts: ServerSaltManager

    readerMap: TlReaderMap
    writerMap: TlWriterMap
}

const TEMP_AUTH_KEY_EXPIRY = 86400 // 24 hours
const PING_INTERVAL = 60000 // 1 minute
const GET_STATE_INTERVAL = 1500 // 1.5 seconds

// destroy_auth_key#d1435160 = DestroyAuthKeyRes;
// const DESTROY_AUTH_KEY = Buffer.from('605134d1', 'hex')
// gzip_packed#3072cfa1 packed_data:string = Object;
const GZIP_PACKED_ID = 0x3072cfa1
// msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;
const MSG_CONTAINER_ID = 0x73f1f8dc
// rpc_result#f35c6d01 req_msg_id:long result:Object = RpcResult;
const RPC_RESULT_ID = 0xf35c6d01
// rpc_error#2144ca19 error_code:int error_message:string = RpcError;
const RPC_ERROR_ID = 0x2144ca19
// invokeAfterMsg#cb9f372d {X:Type} msg_id:long query:!X = X;
const INVOKE_AFTER_MSG_ID = 0xcb9f372d
const INVOKE_AFTER_MSG_SIZE = 12 // 8 (invokeAfterMsg) + 4 (msg_id)

function makeNiceStack(error: tl.RpcError, stack: string, method?: string) {
    error.stack = `RpcError (${error.code} ${error.text}): ${error.message}\n    at ${method}\n${stack
        .split('\n')
        .slice(2)
        .join('\n')}`
}

/**
 * A connection to a single DC.
 */
export class SessionConnection extends PersistentConnection {
    declare readonly params: SessionConnectionParams

    private _flushTimer = new EarlyTimer()
    private _queuedDestroySession: Long[] = []

    // waitForMessage
    private _pendingWaitForUnencrypted: [ControllablePromise<Uint8Array>, NodeJS.Timeout][] = []

    private _usePfs
    private _isPfsBindingPending = false
    private _isPfsBindingPendingInBackground = false
    private _pfsUpdateTimeout?: NodeJS.Timeout

    private _inactivityPendingFlush = false

    private _readerMap: TlReaderMap
    private _writerMap: TlWriterMap
    private _crypto: ICryptoProvider
    private _salts: ServerSaltManager

    constructor(
        params: SessionConnectionParams,
        readonly _session: MtprotoSession,
    ) {
        super(params, _session.log.create('conn'))
        this._flushTimer.onTimeout(this._flush.bind(this))

        this._readerMap = params.readerMap
        this._writerMap = params.writerMap
        this._crypto = params.crypto
        this._salts = params.salts
        this._handleRawMessage = this._handleRawMessage.bind(this)

        this._usePfs = this.params.usePfs ?? false
        this._online = getPlatform().isOnline?.() ?? true
    }

    private _online

    getAuthKey(temp = false): Uint8Array | null {
        const key = temp ? this._session._authKeyTemp : this._session._authKey

        if (!key.ready) return null

        return key.key
    }

    setUsePfs(usePfs: boolean): void {
        if (this._usePfs === usePfs) return

        this.log.debug('use pfs changed to %s', usePfs)
        this._usePfs = usePfs

        if (!usePfs) {
            this._isPfsBindingPending = false
            this._isPfsBindingPendingInBackground = false
            this._session._authKeyTemp.reset()
            clearTimeout(this._pfsUpdateTimeout)
        }

        this._resetSession()
    }

    onTransportClose(): void {
        super.onTransportClose()

        Object.values(this._pendingWaitForUnencrypted).forEach(([prom, timeout]) => {
            prom.reject(new MtcuteError('Connection closed'))
            clearTimeout(timeout)
        })

        // resend pending state_req-s
        for (const msgId of this._session.pendingMessages.keys()) {
            const pending = this._session.pendingMessages.get(msgId)!

            if (pending._ === 'state') {
                this._onMessageFailed(msgId, 'connection loss', true)
            }
        }

        this.emit('disconnect')

        this.reset()
    }

    async destroy(): Promise<void> {
        await super.destroy()
        this.reset(true)
    }

    reset(forever = false): void {
        this._session.initConnectionCalled = false
        this._flushTimer.reset()
        this._salts.isFetching = false

        if (forever) {
            clearTimeout(this._pfsUpdateTimeout)
            this.removeAllListeners()
            this.on('error', (err) => {
                this.log.warn('caught error after destroying: %s', err)
            })
        }
    }

    onConnected(): void {
        // check if we have all the needed keys
        if (!this._session._authKey.ready) {
            if (!this.params.isMainConnection) {
                this.log.info('no auth key, waiting for main connection')

                // once it is done, we will be notified
                return
            }

            this.log.info('no perm auth key, authorizing...')
            this._authorize()

            // if we use pfs, we *could* also start temp key exchange here
            // but telegram restricts us to only have one auth session per connection,
            // and having a separate connection for pfs is not worth it
            return
        }

        if (this._usePfs && !this._session._authKeyTemp.ready) {
            this.log.info('no temp auth key but using pfs, authorizing')
            this._authorizePfs()

            return
        }

        this.log.info('auth keys are already available')
        this.onConnectionUsable()
    }

    protected onError(error: Error): void {
        // https://core.telegram.org/mtproto/mtproto-_transports#_transport-errors
        if (error instanceof TransportError) {
            if (error.code === 404) {
                // if we are using pfs, this could be due to the server
                // forgetting our temp key (which is kinda weird but expected)

                if (this._usePfs) {
                    if (!this._isPfsBindingPending && this._session._authKeyTemp.ready) {
                        this.log.info('transport error 404, reauthorizing pfs')

                        // this is important! we must reset temp auth key before
                        // we proceed with new temp key derivation.
                        // otherwise, we can end up in an infinite loop in case it
                        // was actually perm_key that got 404-ed
                        //
                        // if temp key binding is already in process in background,
                        // _authorizePfs will mark it as foreground to prevent new
                        // queries from being sent (to avoid even more 404s)
                        this._session._authKeyTemp.reset()
                        this._authorizePfs()
                        this._onAllFailed('temp key expired, binding started')

                        return
                    } else if (this._isPfsBindingPending) {
                        this.log.info('transport error 404, pfs binding in progress')

                        this._onAllFailed('temp key expired, binding pending')

                        return
                    }

                    // otherwise, 404 must be referencing the perm_key
                }

                // there happened a little trolling
                this.log.info('transport error 404, reauthorizing')
                this._session.resetAuthKey()
                this._resetSession()
                this.emit('key-change', null)
                this.emit('error', error)

                return
            }

            this.log.error('transport error %d', error.code)
            // all pending queries must be resent
            this._onAllFailed(`transport error ${error.code}`)

            if (error.code === 429) {
                this._session.onTransportFlood(this.emit.bind(this, 'flood-done'))

                return
            }
        }

        this.emit('error', error)
    }

    protected onConnectionUsable() {
        super.onConnectionUsable()

        if (this.params.withUpdates) {
            // we must send some user-related rpc to the server to make sure that
            // it will send us updates
            this.sendRpc({ _: 'updates.getState' }).catch((err: any) => {
                if (this._destroyed || tl.RpcError.is(err, 'AUTH_KEY_UNREGISTERED')) return // silently fail
                this.log.warn('failed to send updates.getState: %s', err.text || err.message)
            })
        }

        // just in case
        this._flushTimer.emitBeforeNext(1000)
    }

    _authorize(): void {
        if (this._session.authorizationPending) {
            this.log.info('_authorize(): authorization already in progress')

            return
        }

        if (!this.params.isMainConnection) {
            // we don't authorize on non-main connections
            this.log.debug('_authorize(): non-main connection, requesting...')
            this.emit('request-auth')

            return
        }

        this._session.authorizationPending = true
        this.emit('auth-begin')

        doAuthorization(this, this._crypto)
            .then(([authKey, serverSalt, timeOffset]) => {
                this._session._authKey.setup(authKey)
                this._salts.currentSalt = serverSalt
                this._session.updateTimeOffset(timeOffset)

                this._session.authorizationPending = false

                this.emit('key-change', authKey)

                if (this._usePfs) {
                    return this._authorizePfs()
                }
                this.onConnectionUsable()
            })
            .catch((err: Error) => {
                this._session.authorizationPending = false
                if (this._destroyed) return
                this.log.error('Authorization error: %s', err.message)
                this.onError(err)
                this.reconnect()
            })
    }

    private _authorizePfs(background = false): void {
        if (this._isPfsBindingPending) return

        if (this._pfsUpdateTimeout) {
            clearTimeout(this._pfsUpdateTimeout)
            this._pfsUpdateTimeout = undefined
        }

        if (this._isPfsBindingPendingInBackground) {
            // e.g. temp key has expired while we were binding a key in the background
            // in this case, we shouldn't start pfs binding again, and instead wait for
            // current operation to complete
            this._isPfsBindingPendingInBackground = false
            this._isPfsBindingPending = true

            return
        }

        if (background) {
            this._isPfsBindingPendingInBackground = true
        } else {
            this._isPfsBindingPending = true
        }

        doAuthorization(this, this._crypto, TEMP_AUTH_KEY_EXPIRY)
            .then(async ([tempAuthKey, tempServerSalt]) => {
                if (!this._usePfs) {
                    this.log.info('pfs has been disabled while generating temp key')

                    return
                }

                const tempKey = this._session._authKeyTempSecondary
                tempKey.setup(tempAuthKey)

                const msgId = this._session.getMessageId()

                this.log.debug(
                    'binding temp_auth_key (%h) to perm_auth_key (%h), msg_id = %l...',
                    tempKey.id,
                    this._session._authKey.id,
                    msgId,
                )

                // we now need to bind the key
                const inner: mtp.RawMt_bind_auth_key_inner = {
                    _: 'mt_bind_auth_key_inner',
                    nonce: randomLong(),
                    tempAuthKeyId: longFromBuffer(tempKey.id),
                    permAuthKeyId: longFromBuffer(this._session._authKey.id),
                    tempSessionId: this._session._sessionId,
                    expiresAt: Math.floor(Date.now() / 1000) + TEMP_AUTH_KEY_EXPIRY,
                }

                // encrypt using mtproto v1 (fucking kill me plz)

                const writer = TlBinaryWriter.alloc(this.params.writerMap, 80)
                // = 40 (inner length) + 32 (mtproto header) + 8 (pad 72 so mod 16 = 0)

                writer.raw(this._crypto.randomBytes(16))
                writer.long(msgId)
                writer.int(0) // seq_no
                writer.int(40) // msg_len
                writer.object(inner)

                const msgWithoutPadding = writer.result()
                writer.raw(this._crypto.randomBytes(8))
                const msgWithPadding = writer.result()

                const hash = this._crypto.sha1(msgWithoutPadding)
                const msgKey = hash.subarray(4, 20)

                const ige = createAesIgeForMessageOld(this._crypto, this._session._authKey.key, msgKey, true)
                const encryptedData = ige.encrypt(msgWithPadding)
                const encryptedMessage = concatBuffers([this._session._authKey.id, msgKey, encryptedData])

                const promise = createControllablePromise<mtp.RawMt_rpc_error | boolean>()

                // encrypt the message using temp key and same msg id
                // this is a bit of a hack, but it works
                //
                // hacking inside main send loop to allow sending
                // with another key is just too much hassle.
                // we could just always use temp key if one is available,
                // but that way we won't be able to refresh the key
                // that is about to expire in the background without
                // interrupting actual message flow
                // decrypting is trivial though, since key id
                // is in the first bytes of the message, and is never used later on.

                this._session.pendingMessages.set(msgId, {
                    _: 'bind',
                    promise,
                })

                const request: tl.auth.RawBindTempAuthKeyRequest = {
                    _: 'auth.bindTempAuthKey',
                    permAuthKeyId: inner.permAuthKeyId,
                    nonce: inner.nonce,
                    expiresAt: inner.expiresAt,
                    encryptedMessage,
                }
                const reqSize = TlSerializationCounter.countNeededBytes(this._writerMap, request)
                const reqWriter = TlBinaryWriter.alloc(this._writerMap, reqSize + 16)
                reqWriter.long(this._registerOutgoingMsgId(msgId))
                reqWriter.uint(this._session.getSeqNo())
                reqWriter.uint(reqSize)
                reqWriter.object(request)

                // we can now send it as is
                const requestEncrypted = tempKey.encryptMessage(
                    reqWriter.result(),
                    tempServerSalt,
                    this._session._sessionId,
                )
                await this.send(requestEncrypted)

                const res = await promise

                this._session.pendingMessages.delete(msgId)

                if (!this._usePfs) {
                    this.log.info('pfs has been disabled while binding temp key')

                    return
                }

                if (typeof res === 'object') {
                    this.log.error('failed to bind temp key: %s:%s', res.errorCode, res.errorMessage)
                    throw new MtcuteError('Failed to bind temporary key')
                }

                // now we can swap the keys (secondary becomes primary,
                // and primary is not immediately forgot because messages using it may still be in flight)

                this._session._authKeyTempSecondary = this._session._authKeyTemp
                this._session._authKeyTemp = tempKey
                this._salts.currentSalt = tempServerSalt

                this.log.debug('temp key has been bound, exp = %d', inner.expiresAt)

                this._isPfsBindingPending = false
                this._isPfsBindingPendingInBackground = false

                // we must re-init connection after binding temp key
                this._session.initConnectionCalled = false

                this.emit('tmp-key-change', tempAuthKey, inner.expiresAt)
                this.onConnectionUsable()

                // set a timeout to update temp auth key in advance to avoid interruption
                this._pfsUpdateTimeout = setTimeout(
                    () => {
                        this._pfsUpdateTimeout = undefined
                        this.log.debug('temp key is expiring soon')
                        this._authorizePfs(true)
                    },
                    (TEMP_AUTH_KEY_EXPIRY - 60) * 1000,
                )
            })
            .catch((err: Error) => {
                if (this._destroyed) return
                this.log.error('PFS Authorization error: %s', err.message)

                if (this._isPfsBindingPendingInBackground) {
                    this._isPfsBindingPendingInBackground = false

                    // if we are in background, we can just retry
                    return this._authorizePfs(true)
                }

                this._isPfsBindingPending = false
                this.onError(err)
                this.reconnect()
            })
    }

    waitForUnencryptedMessage(timeout = 5000): Promise<Uint8Array> {
        if (this._destroyed) {
            return Promise.reject(new MtcuteError('Connection destroyed'))
        }
        const promise = createControllablePromise<Uint8Array>()
        const timeoutId = setTimeout(() => {
            promise.reject(new MtTimeoutError(timeout))
            this._pendingWaitForUnencrypted = this._pendingWaitForUnencrypted.filter((it) => it[0] !== promise)
        }, timeout)
        this._pendingWaitForUnencrypted.push([promise, timeoutId])

        return promise
    }

    protected onMessage(data: Uint8Array): void {
        if (this._pendingWaitForUnencrypted.length) {
            const int32 = new Int32Array(data.buffer, data.byteOffset, 2)

            if (int32[0] === 0 && int32[1] === 0) {
                // auth_key_id = 0, meaning it's an unencrypted message used for authorization

                const [promise, timeout] = this._pendingWaitForUnencrypted.shift()!
                clearTimeout(timeout)
                promise.resolve(data)

                return
            }
        }

        if (!this._session._authKey.ready) {
            // if a message is received before authorization,
            // either the server is misbehaving,
            // or there was a problem with authorization.
            this.log.warn('received message before authorization: %h', data)

            return
        }

        try {
            this._session.decryptMessage(data, this._handleRawMessage)
        } catch (err) {
            this.log.error('failed to decrypt message: %s\ndata: %h', err, data)
        }
    }

    private _handleRawMessage(messageId: Long, seqNo: number, message: TlBinaryReader): void {
        const objectId = message.uint()

        if (objectId === GZIP_PACKED_ID) {
            return this._handleRawMessage(
                messageId,
                seqNo,
                new TlBinaryReader(this._readerMap, this._crypto.gunzip(message.bytes())),
            )
        }

        if (objectId === MSG_CONTAINER_ID) {
            const count = message.uint()

            for (let i = 0; i < count; i++) {
                // msg_id:long seqno:int bytes:int
                const msgId = message.long()
                const seqNo = message.uint() // seqno
                const length = message.uint()

                // container can't contain other containers, but can contain rpc_result
                const obj = message.raw(length)

                this._handleRawMessage(msgId, seqNo, new TlBinaryReader(this._readerMap, obj))
            }

            return
        }

        if (objectId === RPC_RESULT_ID) {
            return this._onRpcResult(messageId, message)
        }

        // we are safe.. i guess
        this._handleMessage(messageId, message.object(objectId))
    }

    private _handleMessage(messageId: Long, message_: unknown): void {
        if (messageId.isEven()) {
            this.log.warn('warn: ignoring message with invalid messageId = %s (is even)', messageId)

            return
        }

        if (this._session.recentIncomingMsgIds.has(messageId)) {
            this.log.debug('ignoring duplicate message %s', messageId)

            return
        }
        const message = message_ as mtp.TlObject

        this.log.debug('received %s (msg_id: %l)', message._, messageId)
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
                this._onMessageInfo(message.msgId, message.status, message.answerMsgId)
                break
            case 'mt_msg_new_detailed_info':
                this._onMessageInfo(Long.ZERO, 0, message.answerMsgId)
                break
            case 'mt_msgs_state_info':
                this._onMsgsStateInfo(message)
                break
            case 'mt_future_salts':
                this._onFutureSalts(message)
                break
            case 'mt_msgs_state_req':
            case 'mt_msg_resend_req':
                // tdlib doesnt handle them, so why should we? :upside_down_face:
                this.log.warn('received %s (msg_id = %l): %j', message._, messageId, message)
                break
            case 'mt_destroy_session_ok':
            case 'mt_destroy_session_none':
                this._onDestroySessionResult(message)
                break
            default:
                if (tl.isAnyUpdates(message)) {
                    if (this._usable && this.params.inactivityTimeout) {
                        this._rescheduleInactivity()
                    }

                    this.log.verbose('<<< %j', message)

                    if (this.params.disableUpdates) {
                        this.log.warn('received updates, but updates are disabled')
                        // likely due to some request in the session missing invokeWithoutUpdates
                        break
                    }

                    this.emit('update', message)

                    return
                }

                this.log.warn('unknown message received: %j', message)
        }
    }

    private _onRpcResult(messageId: Long, message: TlBinaryReader): void {
        if (this._usable && this.params.inactivityTimeout) {
            this._rescheduleInactivity()
        }

        const reqMsgId = message.long()

        if (reqMsgId.isZero()) {
            let resultType

            try {
                // eslint-disable-next-line
                resultType = (message.object() as any)._
            } catch (err) {
                resultType = message.peekUint()
            }
            this.log.warn('received rpc_result with %j with req_msg_id = 0', resultType)

            return
        }

        const msg = this._session.pendingMessages.get(reqMsgId)

        if (!msg) {
            let result

            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                result = message.object() as any
            } catch (err) {
                result = '[failed to parse]'
            }

            // check if the msg is one of the recent ones
            if (this._session.recentOutgoingMsgIds.has(reqMsgId)) {
                this.log.debug('received rpc_result again for %l (contains %j)', reqMsgId, result)
            } else {
                this.log.warn('received rpc_result for unknown message %l: %j', reqMsgId, result)
            }

            return
        }

        this._sendAck(messageId)

        // special case for auth key binding
        if (msg._ !== 'rpc') {
            if (msg._ === 'bind') {
                this._sendAck(messageId)
                msg.promise.resolve(message.object())

                return
            }

            if (msg._ === 'cancel') {
                let result

                try {
                    result = message.object() as mtp.TlObject
                } catch (err) {
                    this.log.debug('failed to parse rpc_result for cancel request %l, ignoring', reqMsgId)

                    return
                }

                this.log.debug('received %s for cancelled request %l: %j', result._, reqMsgId, result)
                this._onMessageAcked(reqMsgId)

                return
            }

            this.log.error('received rpc_result for %s request %l', msg._, reqMsgId)

            return
        }

        const rpc = msg.rpc

        const resultConstructorId = message.peekUint()

        let result: any

        const customReader = this._readerMap._results![rpc.method]

        if (resultConstructorId === RPC_ERROR_ID) {
            // we need to handle this before anything else because otherwise we might
            // try to use customReader on an error which will inevitably fail or break
            result = message.object()
        } else if (customReader) {
            result = customReader(message)
        } else {
            const objectId = message.uint()

            if (objectId === GZIP_PACKED_ID) {
                const inner = this._crypto.gunzip(message.bytes())
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                result = TlBinaryReader.deserializeObject(this._readerMap, inner)
            } else {
                result = message.object(objectId)
            }
        }

        // initConnection call was definitely received and
        // processed by the server, so we no longer need to use it
        // todo: is this the case with failed invokeAfterMsg(s) as well?
        if (rpc.initConn) {
            this._session.initConnectionCalled = true
        }

        rpc.done = true

        this.log.verbose('<<< (%s:%l) %j', rpc.method, reqMsgId, result)

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

            switch (res.errorMessage) {
                case 'AUTH_KEY_PERM_EMPTY':
                    // happens when temp auth key is not yet bound
                    // this shouldn't happen as we block any outbound communications
                    // until the temp key is derived and bound.
                    //
                    // i think it is also possible for the error to be returned
                    // when the temp key has expired, but this still shouldn't happen
                    // but this is tg, so something may go wrong, and we will receive this as an error
                    // (for god's sake why is this not in mtproto and instead hacked into the app layer)
                    this._authorizePfs()
                    this._onMessageFailed(reqMsgId, 'AUTH_KEY_PERM_EMPTY', true)

                    return
                case 'CONNECTION_NOT_INITED': {
                    // this seems to sometimes happen when using pfs
                    // no idea why, but tdlib also seems to handle these, so whatever

                    this._session.initConnectionCalled = false
                    this._onMessageFailed(reqMsgId, res.errorMessage, true)

                    // just setting this flag is not enough because the message
                    // is already serialized, so we do this awesome hack
                    this.sendRpc({ _: 'help.getNearestDc' })
                        .then(() => {
                            this.log.debug('additional help.getNearestDc for initConnection ok')
                        })
                        .catch((err) => {
                            this.log.debug('additional help.getNearestDc for initConnection error: %s', err)
                        })

                    return
                }
                case 'MSG_WAIT_TIMEOUT':
                case 'MSG_WAIT_FAILED': {
                    if (!rpc.invokeAfter) {
                        this.log.warn('received %s for non-chained request %l', res.errorMessage, reqMsgId)

                        break
                    }

                    // in some cases, MSG_WAIT_TIMEOUT is returned instead of MSG_WAIT_FAILED when one of the deps
                    // failed with MSG_WAIT_TIMEOUT. i have no clue why, this makes zero sense, but what fucking ever
                    //
                    // this basically means we can't handle a timeout any different than a general failure,
                    // because the timeout might not refer to the immediate `.invokeAfter` message, but to
                    // its arbitrary-depth dependency, so we indeed have to wait for the message ourselves...

                    if (this._session.pendingMessages.has(rpc.invokeAfter)) {
                        // the dependency is still pending, postpone the processing
                        this.log.debug(
                            'chain %s: waiting for %l before processing %l',
                            rpc.chainId,
                            rpc.invokeAfter,
                            reqMsgId,
                        )
                        this._session.getPendingChainedFails(rpc.chainId!).insert(rpc)
                    } else {
                        this._session.chains.delete(rpc.chainId!)
                        this._onMessageFailed(reqMsgId, 'MSG_WAIT_FAILED', true)
                    }

                    return
                }
            }

            const error = tl.RpcError.fromTl(res)

            if (this.params.niceStacks !== false) {
                makeNiceStack(error, rpc.stack!, rpc.method)
            }

            if (error.unknown && this.params.enableErrorReporting) {
                reportUnknownError(this.log, error, rpc.method)
            }

            rpc.promise.reject(error)
        } else {
            this.log.debug('received rpc_result (%s) for request %l (%s)', result._, reqMsgId, rpc.method)

            if (rpc.cancelled) return

            rpc.promise.resolve(result)
        }

        if (rpc.chainId) {
            this._processPendingChainedFails(rpc.chainId, reqMsgId)
        }

        this._onMessageAcked(reqMsgId)
        this._session.pendingMessages.delete(reqMsgId)
    }

    private _processPendingChainedFails(chainId: number | string, sinceMsgId: Long): void {
        // sinceMsgId was already definitely received and contained an error.
        // we should now re-send all the pending MSG_WAIT_FAILED after it
        this._session.removeFromChain(chainId, sinceMsgId)

        const oldPending = this._session.chainsPendingFails.get(chainId)

        if (!oldPending?.length) {
            return
        }

        const idx = oldPending.index({ invokeAfter: sinceMsgId } as PendingRpc, true)
        if (idx === -1) return

        const toFail = oldPending.raw.splice(idx)

        this.log.debug('chain %s: failing %d dependant messages: %L', chainId, toFail.length, toFail)

        // we're failing the rest of the chain, including the last message
        this._session.chains.delete(chainId)

        for (const rpc of toFail) {
            this._onMessageFailed(rpc.msgId!, 'MSG_WAIT_FAILED', true)
        }
    }

    private _onMessageAcked(msgId: Long, inContainer = false): void {
        const msg = this._session.pendingMessages.get(msgId)

        if (!msg) {
            if (!this._session.recentOutgoingMsgIds.has(msgId)) {
                this.log.warn('received ack for unknown message %l', msgId)
            }

            return
        }

        switch (msg._) {
            case 'container':
                this.log.debug('received ack for container %l (size = %d)', msgId, msg.msgIds.length)

                msg.msgIds.forEach((msgId) => this._onMessageAcked(msgId, true))

                // we no longer need info about the container
                this._session.pendingMessages.delete(msgId)
                break

            case 'rpc': {
                const rpc = msg.rpc
                this.log.debug('received ack for rpc query %l (%s, acked before = %s)', msgId, rpc.method, rpc.acked)

                rpc.acked = true

                if (!inContainer && rpc.containerId && this._session.pendingMessages.has(rpc.containerId)) {
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
            case 'bind':
            case 'cancel':
                break // do nothing, wait for the result

            default:
                if (!inContainer) {
                    this.log.warn('received unexpected ack for %s query %l', msg._, msgId)
                }
        }
    }

    private _onAllFailed(reason: string) {
        // called when all the pending messages are to be resent
        // e.g. when server returns 429
        // most service messages can be omitted as stale

        this.log.debug('all messages failed because of %s', reason)

        for (const msgId of this._session.pendingMessages.keys()) {
            const info = this._session.pendingMessages.get(msgId)!

            switch (info._) {
                case 'container':
                case 'state':
                case 'resend':
                case 'ping':
                    // no longer relevant
                    this.log.debug('forgetting about %s message %l', info._, msgId)
                    this._session.pendingMessages.delete(msgId)
                    break
                default:
                    this._onMessageFailed(msgId, reason, true)
                    break
            }
        }
    }

    private _onMessageFailed(msgId: Long, reason: string, inContainer = false): void {
        const msgInfo = this._session.pendingMessages.get(msgId)

        if (!msgInfo) {
            this.log.debug('unknown message %l failed because of %s', msgId, reason)

            return
        }

        switch (msgInfo._) {
            case 'container':
                this.log.debug('container %l (size = %d) failed because of %s', msgId, msgInfo.msgIds.length, reason)
                msgInfo.msgIds.forEach((msgId) => this._onMessageFailed(msgId, reason, true))
                break
            case 'ping':
                this.log.debug('ping (msg_id = %l) failed because of %s', msgId, reason)
                // restart ping
                this._session.resetLastPing(true)
                break

            case 'rpc': {
                const rpc = msgInfo.rpc
                this.log.debug('rpc query %l (%s) failed because of %s', msgId, rpc.method, reason)

                // since the query was rejected, we can let it reassign msg_id to avoid containers
                this._session.pendingMessages.delete(msgId)
                rpc.msgId = undefined
                this._enqueueRpc(rpc, true)

                if (!inContainer && rpc.containerId && this._session.pendingMessages.has(rpc.containerId)) {
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
            case 'bind':
                this.log.debug('temp key binding request %l failed because of %s, retrying', msgId, reason)
                msgInfo.promise.reject(Error(reason))
                break
            case 'future_salts':
                this.log.debug('future_salts request %l failed because of %s, will retry', msgId, reason)
                this._salts.isFetching = false
                // this is enough to make it retry on the next flush.
                break
        }

        this._session.pendingMessages.delete(msgId)
    }

    private _registerOutgoingMsgId(msgId: Long): Long {
        this._session.recentOutgoingMsgIds.add(msgId)

        return msgId
    }

    private _onPong({ msgId, pingId }: mtp.RawMt_pong): void {
        const info = this._session.pendingMessages.get(msgId)

        if (!info) {
            this.log.warn('received pong to unknown ping (msg_id %l, ping_id %l)', msgId, pingId)

            return
        }

        if (info._ !== 'ping') {
            this.log.warn('received pong to %s query, not ping (msg_id %l, ping_id %l)', info._, msgId, pingId)

            return
        }

        if (info.pingId.neq(pingId)) {
            this.log.warn('received pong to %l, but expected ping_id = %l (got %l)', msgId, info.pingId, pingId)
        }

        const rtt = Date.now() - this._session.lastPingTime
        this._session.lastPingRtt = rtt

        if (info.containerId.neq(msgId)) {
            this._onMessageAcked(info.containerId)
        }

        this.log.debug('received pong: msg_id %l, ping_id %l, rtt = %dms', msgId, pingId, rtt)
        this._session.resetLastPing()
    }

    private _onBadServerSalt(msg: mtp.RawMt_bad_server_salt): void {
        this._salts.currentSalt = msg.newServerSalt

        this._onMessageFailed(msg.badMsgId, 'bad_server_salt')
    }

    private _onBadMsgNotification(msgId: Long, msg: mtp.RawMt_bad_msg_notification): void {
        switch (msg.errorCode) {
            case 16:
            case 17:
            case 20: {
                if (msg.errorCode !== 20) {
                    // msg_id is either too high or too low
                    // code 20 means msg_id is too old,
                    // we just need to resend the message
                    const serverTime = msgId.high >>> 0
                    const timeOffset = Math.floor(Date.now() / 1000) - serverTime

                    this._session.updateTimeOffset(timeOffset)
                    this.log.debug('server time: %d, corrected offset to %d', serverTime, timeOffset)
                }

                this._onMessageFailed(msg.badMsgId, `bad_msg_notification ${msg.errorCode}`)
                break
            }
            default:
                // something went very wrong, we need to reset the session
                this.log.error(
                    'received bad_msg_notification for msg_id = %l, code = %d. session will be reset',
                    msg.badMsgId,
                    msg.errorCode,
                )
                this._resetSession()
                break
        }
    }

    private _onNewSessionCreated({ firstMsgId, serverSalt, uniqueId }: mtp.RawMt_new_session_created): void {
        if (uniqueId.eq(this._session.lastSessionCreatedUid)) {
            this.log.debug('received new_session_created with the same uid = %l, ignoring', uniqueId)

            return
        }

        if (!this._session.lastSessionCreatedUid.isZero() && !this.params.disableUpdates) {
            // force the client to fetch missed updates
            // when _lastSessionCreatedUid == 0, the connection has
            // just been established, and the client will fetch them anyways
            this.emit('update', { _: 'updatesTooLong' })
        }

        this._salts.currentSalt = serverSalt

        this.log.debug('received new_session_created, uid = %l, first msg_id = %l', uniqueId, firstMsgId)

        for (const msgId of this._session.pendingMessages.keys()) {
            const val = this._session.pendingMessages.get(msgId)!

            if (val._ === 'bind') {
                // should NOT happen.
                if (msgId.lt(firstMsgId)) {
                    this._onMessageFailed(msgId, 'received in wrong session')
                }
                continue
            }

            if (val._ === 'container') {
                if (msgId.lt(firstMsgId)) {
                    // all messages in this container will be resent
                    // info about this container is no longer needed
                    this._session.pendingMessages.delete(msgId)
                }

                return
            }

            const containerId = val._ === 'rpc' ? val.rpc.containerId || msgId : val.containerId

            if (containerId.lt(firstMsgId)) {
                this._onMessageFailed(msgId, 'new_session_created', true)
            }
        }
    }

    private _onMessageInfo(msgId: Long, status: number, answerMsgId: Long): void {
        if (!msgId.isZero()) {
            const info = this._session.pendingMessages.get(msgId)

            if (!info) {
                if (!this._session.recentOutgoingMsgIds.has(msgId)) {
                    this.log.warn('received message info about unknown message %l', msgId)
                }

                return
            }

            switch (status & 7) {
                case 1:
                case 2:
                case 3:
                    // message wasn't received by the server
                    return this._onMessageFailed(msgId, `message info state ${status}`)
                    break

                case 0:
                    if (!answerMsgId.isZero()) {
                        this.log.warn(
                            'received message info with status = 0: msg_id = %l, status = %d, ans_id = %l',
                            msgId,
                            status,
                            answerMsgId,
                        )

                        return this._onMessageFailed(msgId, 'message info state = 0, ans_id = 0')
                    }
                // fallthrough
                case 4:
                    this._onMessageAcked(msgId)
                    break
            }
        }

        if (!answerMsgId.isZero() && !this._session.recentIncomingMsgIds.has(answerMsgId)) {
            this.log.debug('received message info for %l, but answer (%l) was not received yet', msgId, answerMsgId)
            this._session.queuedResendReq.push(answerMsgId)
            this._flushTimer.emitWhenIdle()

            return
        }

        if (answerMsgId.isZero()) {
            this.log.debug('received message info for %l: message is still pending (status = %d)', msgId, status)

            return
        }

        this.log.debug('received message info for %l, and answer (%l) was already received', msgId, answerMsgId)
    }

    private _onMessagesInfo(msgIds: Long[], info: Uint8Array): void {
        if (msgIds.length !== info.length) {
            this.log.warn('messages state info was invalid: msg_ids.length !== info.length')
        }

        for (let i = 0; i < msgIds.length; i++) {
            this._onMessageInfo(msgIds[i], info[i], Long.ZERO)
        }
    }

    private _onMsgsStateInfo(msg: mtp.RawMt_msgs_state_info): void {
        const info = this._session.pendingMessages.get(msg.reqMsgId)

        if (!info) {
            this.log.warn('received msgs_state_info to unknown request %l', msg.reqMsgId)

            return
        }

        if (info._ !== 'state') {
            this.log.warn('received msgs_state_info to %s query %l', info._, msg.reqMsgId)

            return
        }

        this._session.pendingMessages.delete(msg.reqMsgId)

        this._onMessagesInfo(info.msgIds, msg.info)
    }

    private _onFutureSalts(msg: mtp.RawMt_future_salts): void {
        const info = this._session.pendingMessages.get(msg.reqMsgId)

        if (!info) {
            this.log.warn('received future_salts to unknown request %l', msg.reqMsgId)

            return
        }

        if (info._ !== 'future_salts') {
            this.log.warn('received future_salts to %s query %l', info._, msg.reqMsgId)

            return
        }

        this._session.pendingMessages.delete(msg.reqMsgId)

        this.log.debug('received future_salts: %d salts', msg.salts.length)

        this._salts.isFetching = false
        this._salts.setFutureSalts(msg.salts.slice())
        this.emit('future-salts', msg.salts)
    }

    private _onDestroySessionResult(msg: mtp.TypeDestroySessionRes): void {
        const reqMsgId = this._session.destroySessionIdToMsgId.get(msg.sessionId)

        if (!reqMsgId) {
            this.log.warn('received %s for unknown session %h', msg._, msg.sessionId)

            return
        }

        this._session.destroySessionIdToMsgId.delete(msg.sessionId)
        this._session.pendingMessages.delete(reqMsgId)
        this.log.debug('received %s for session %h', msg._, msg.sessionId)
    }

    private _enqueueRpc(rpc: PendingRpc, force?: boolean) {
        if (this._session.enqueueRpc(rpc, force)) {
            this._flushTimer.emitWhenIdle()
        }
    }

    _resetSession(): void {
        this._queuedDestroySession.push(this._session._sessionId)

        this._session.resetState(true)
        this._onAllFailed('session reset')
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
            this._flushTimer.emitWhenIdle()
        }
    }

    sendRpc<T extends tl.RpcMethod>(
        request: T,
        stack?: string,
        timeout?: number,
        abortSignal?: AbortSignal,
        chainId?: string | number,
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

            this.log.debug('wrapping %s with initConnection, layer: %d', method, this.params.layer)
            const proxy = this._transport.getMtproxyInfo?.()
            obj = {
                _: 'invokeWithLayer',
                layer: this.params.layer,
                query: {
                    ...this.params.initConnection,
                    proxy,
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
            throw new MtArgumentError(`Payload is too big (${content.length} > 1044404)`)
        }

        // gzip
        let shouldGzip = content.length > 128

        if (content.length > 16384) {
            // test compression ratio for the middle part
            // if it is less than 0.9, then try to compress the whole request

            const middle = ~~((content.length - 1024) / 2)
            const middlePart = content.subarray(middle, middle + 1024)
            const gzipped = this._crypto.gzip(middlePart, Math.floor(middlePart.length * 0.9))

            if (!gzipped) shouldGzip = false
        }

        if (shouldGzip) {
            const gzipped = this._crypto.gzip(content, Math.floor(content.length * 0.9))

            if (gzipped) {
                this.log.debug('gzipped %s (%db -> %db)', method, content.length, gzipped.length)

                content = gzipped
            } else {
                shouldGzip = false
            }
        }

        const pending: PendingRpc = {
            method,
            promise: createControllablePromise(),
            data: content,
            stack,
            // we will need to know size of gzip_packed overhead in _flush()
            gzipOverhead: shouldGzip ? 4 + TlSerializationCounter.countBytesOverhead(content.length) : 0,
            initConn,
            chainId,

            // setting them as well so jit can optimize stuff
            invokeAfter: undefined,
            sent: undefined,
            done: undefined,
            getState: undefined,
            msgId: undefined,
            seqNo: undefined,
            containerId: undefined,
            acked: undefined,
            cancelled: undefined,
            timeout: undefined,
        }

        if (abortSignal?.aborted) {
            pending.promise.reject(abortSignal.reason)

            return pending.promise
        }

        if (timeout) {
            pending.timeout = setTimeout(() => this._cancelRpc(pending, true), timeout)
        }

        if (abortSignal) {
            abortSignal.addEventListener('abort', () => this._cancelRpc(pending, false, abortSignal))
        }

        this._enqueueRpc(pending, true)

        return pending.promise
    }

    notifyNetworkChanged(online: boolean): void {
        this._online = online

        if (online) {
            this.reconnect()
        } else {
            this.disconnectManual().catch((err) => {
                this.log.warn('error while disconnecting: %s', err)
            })
        }
    }

    private _cancelRpc(rpc: PendingRpc, onTimeout = false, abortSignal?: AbortSignal): void {
        if (rpc.done) return

        if (rpc.cancelled && !onTimeout) {
            throw new MtcuteError('RPC was already cancelled')
        }

        if (!onTimeout && rpc.timeout) {
            clearTimeout(rpc.timeout)
        }

        if (onTimeout) {
            // todo: replace with MtTimeoutError
            const error = new tl.RpcError(400, 'Client timeout')

            if (this.params.niceStacks !== false) {
                makeNiceStack(error, rpc.stack!, rpc.method)
            }

            rpc.promise.reject(error)
        } else if (abortSignal) {
            rpc.promise.reject(abortSignal.reason)
        }

        rpc.cancelled = true

        if (rpc.msgId) {
            this._session.queuedCancelReq.push(rpc.msgId)
            this._session.getStateSchedule.remove(rpc)
            this._flushTimer.emitWhenIdle()
        } else {
            // in case rpc wasn't sent yet (or had some error),
            // we can simply remove it from queue
            this._session.queuedRpc.remove(rpc)
        }
    }

    protected _onInactivityTimeout() {
        // we should send all pending acks and other service messages
        // before dropping the connection
        // additionally, if we are still waiting for some rpc results,
        // we should wait for them first

        let hasPendingRpc = false

        for (const it of this._session.pendingMessages.values()) {
            if (it._ === 'rpc') {
                hasPendingRpc = true
                break
            }
        }

        if (hasPendingRpc) {
            this.log.debug('waiting for pending rpc queries to finish before closing connection')
            this._rescheduleInactivity()

            return
        }

        if (!this._session.hasPendingMessages) {
            this.log.debug('no pending service messages, closing connection')
            super._onInactivityTimeout()

            return
        }

        this._inactivityPendingFlush = true
        this._flush()
    }

    flushWhenIdle(): void {
        this._flushTimer.emitWhenIdle()
    }

    private _flush(): void {
        if (
            this._disconnectedManually ||
            !this._session._authKey.ready ||
            this._isPfsBindingPending ||
            this._session.current429Timeout
        ) {
            this.log.debug(
                'skipping flush, connection is not usable (offline = %b, auth key ready = %b, pfs binding pending = %b, 429 timeout = %b)',
                this._disconnectedManually,
                this._session._authKey.ready,
                this._isPfsBindingPending,
                this._session.current429Timeout,
            )

            // it will be flushed once connection is usable
            return
        }

        try {
            this._doFlush()
        } catch (e: any) {
            this.log.error('flush error: %s', (e as Error).stack)
            // should not happen unless there's a bug in the code
        }

        // schedule next flush
        // if there are more queued requests, flush immediately
        // (they likely didn't fit into one message)
        if (this._session.hasPendingMessages) {
            // we schedule it on the next tick, so we can load-balance
            // between multiple connections using the same session
            this._flushTimer.emitWhenIdle()
        } else {
            const nextPingTime = this._session.lastPingTime + PING_INTERVAL
            const nextGetScheduleTime = this._session.getStateSchedule.raw[0]?.getState || Infinity

            this._flushTimer.emitBefore(Math.min(nextPingTime, nextGetScheduleTime))
        }
    }

    private _doFlush(): void {
        this.log.debug('flushing send queue. queued rpc: %d', this._session.queuedRpc.length)

        // oh bloody hell mate

        // total size & count
        let packetSize = 0
        let messageCount = 0
        // size & msg count that count towards container limit
        // these will be added to total later
        let containerMessageCount = 0
        let containerSize = 0

        let ackRequest: Uint8Array | null = null
        let ackMsgIds: Long[] | null = null

        let getFutureSaltsRequest: Uint8Array | null = null
        let getFutureSaltsMsgId: Long | null = null

        let pingRequest: Uint8Array | null = null
        let pingId: Long | null = null
        let pingMsgId: Long | null = null

        let getStateRequest: Uint8Array | null = null
        let getStateMsgId: Long | null = null
        let getStateMsgIds: Long[] | null = null

        let resendRequest: Uint8Array | null = null
        let resendMsgId: Long | null = null
        let resendMsgIds: Long[] | null = null

        let cancelRpcs: Long[] | null = null
        let destroySessions: Long[] | null = null
        let rootMsgId: Long | null = null

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

        if (now - this._session.lastPingTime > PING_INTERVAL) {
            if (!this._session.lastPingMsgId.isZero()) {
                this.log.warn("didn't receive pong for previous ping (msg_id = %l)", this._session.lastPingMsgId)
                this._session.pendingMessages.delete(this._session.lastPingMsgId)
            }

            pingId = randomLong()
            const obj: mtp.RawMt_ping_delay_disconnect = {
                _: 'mt_ping_delay_disconnect',
                pingId,
                disconnectDelay: 75,
            }

            this._session.lastPingTime = Date.now()

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

            const idx = this._session.getStateSchedule.index({ getState: now } as PendingRpc, true)

            if (idx > 0) {
                const toGetState = this._session.getStateSchedule.raw.splice(0, idx)
                if (!getStateMsgIds) getStateMsgIds = []
                toGetState.forEach((it) => getStateMsgIds!.push(it.msgId!))
            }

            if (getStateMsgIds) {
                const obj: mtp.RawMt_msgs_state_req = {
                    _: 'mt_msgs_state_req',
                    msgIds: getStateMsgIds,
                }

                getStateRequest = TlBinaryWriter.serializeObject(this._writerMap, obj)
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
            containerMessageCount += this._queuedDestroySession.length
            containerSize += this._queuedDestroySession.length * 28
            destroySessions = this._queuedDestroySession
            this._queuedDestroySession = []
        }

        if (this._salts.shouldFetchSalts()) {
            const obj: mtp.RawMt_get_future_salts = {
                _: 'mt_get_future_salts',
                num: 64,
            }

            getFutureSaltsRequest = TlBinaryWriter.serializeObject(this._writerMap, obj)
            containerSize += getFutureSaltsRequest.length + 16
            containerMessageCount += 1
            this._salts.isFetching = true
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

            if (msg.chainId) {
                containerSize += INVOKE_AFTER_MSG_SIZE
            }

            // if message was already assigned a msg_id,
            // we must wrap it in a container with a newer msg_id
            if (msg.msgId) forceContainer = true

            // having >1 upload.getFile within a container seems to cause flood_wait errors
            // also a crutch for load-balancing
            if (msg.method === 'upload.getFile') break
        }

        packetSize += containerSize
        messageCount += containerMessageCount + rpcToSend.length

        if (!messageCount) {
            this.log.debug('flush did not happen: nothing to flush')

            return
        }

        const useContainer = forceContainer || messageCount > 1
        if (useContainer) packetSize += 24 // 8 (msg_container) + 16 (mtproto header)

        const writer = TlBinaryWriter.alloc(this._writerMap, packetSize)

        if (useContainer) {
            // leave bytes for mtproto header (we'll write it later,
            // since we need seqno and msg_id to be larger than the content)
            writer.pos += 16
            writer.uint(MSG_CONTAINER_ID)
            writer.uint(messageCount)
        }

        const otherPendings: Exclude<PendingMessage, { _: 'rpc' | 'container' | 'bind' }>[] = []

        if (ackRequest) {
            this._registerOutgoingMsgId(this._session.writeMessage(writer, ackRequest))
        }

        if (pingRequest) {
            pingMsgId = this._registerOutgoingMsgId(this._session.writeMessage(writer, pingRequest))
            this._session.lastPingMsgId = pingMsgId
            const pingPending: PendingMessage = {
                _: 'ping',
                pingId: pingId!,
                containerId: pingMsgId,
            }
            this._session.pendingMessages.set(pingMsgId, pingPending)
            otherPendings.push(pingPending)
        }

        if (getStateRequest) {
            getStateMsgId = this._registerOutgoingMsgId(this._session.writeMessage(writer, getStateRequest))
            const getStatePending: PendingMessage = {
                _: 'state',
                msgIds: getStateMsgIds!,
                containerId: getStateMsgId,
            }
            this._session.pendingMessages.set(getStateMsgId, getStatePending)
            otherPendings.push(getStatePending)
        }

        if (resendRequest) {
            resendMsgId = this._registerOutgoingMsgId(this._session.writeMessage(writer, resendRequest))
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
                this._session.destroySessionIdToMsgId.set(sessionId, msgId)
                otherPendings.push(pending)
            })
        }

        if (getFutureSaltsRequest) {
            getFutureSaltsMsgId = this._registerOutgoingMsgId(this._session.writeMessage(writer, getFutureSaltsRequest))
            const pending: PendingMessage = {
                _: 'future_salts',
                containerId: getFutureSaltsMsgId,
            }
            this._session.pendingMessages.set(getFutureSaltsMsgId, pending)
            otherPendings.push(pending)
        }

        const getStateTime = now + GET_STATE_INTERVAL

        for (let i = 0; i < rpcToSend.length; i++) {
            const msg = rpcToSend[i]
            // not using writeMessage here because we also need seqNo, and
            // i dont want to also return seqNo there because that would mean
            // extra object overhead

            if (!msg.msgId) {
                const msgId = this._session.getMessageId()
                const seqNo = this._session.getSeqNo()

                this.log.debug('%s: msg_id assigned %l, seqno: %d', msg.method, msgId, seqNo)

                msg.msgId = msgId
                msg.seqNo = seqNo
                this._session.pendingMessages.set(msgId, {
                    _: 'rpc',
                    rpc: msg,
                })

                if (msg.chainId) {
                    msg.invokeAfter = this._session.addToChain(msg.chainId, msgId)
                    this.log.debug('chain %s: invoke %l after %l', msg.chainId, msg.msgId, msg.invokeAfter)
                }
            } else {
                this.log.debug('%s: msg_id already assigned, reusing %l, seqno: %d', msg.method, msg.msgId, msg.seqNo)
            }

            // (re-)schedule get_state if needed
            if (msg.getState) {
                this._session.getStateSchedule.remove(msg)
            }
            if (!msg.acked) {
                msg.getState = getStateTime
                this._session.getStateSchedule.insert(msg)
            }

            if (rootMsgId === null) rootMsgId = msg.msgId
            writer.long(this._registerOutgoingMsgId(msg.msgId))
            writer.uint(msg.seqNo!)

            const invokeAfterSize = msg.invokeAfter ? INVOKE_AFTER_MSG_SIZE : 0

            const writeInvokeAfter = () => {
                if (!msg.invokeAfter) return

                writer.uint(INVOKE_AFTER_MSG_ID)
                writer.long(msg.invokeAfter)
            }

            if (msg.gzipOverhead) {
                writer.uint(msg.data.length + msg.gzipOverhead + invokeAfterSize)
                writeInvokeAfter()
                writer.uint(GZIP_PACKED_ID)
                writer.bytes(msg.data)
            } else {
                writer.uint(msg.data.length + invokeAfterSize)
                writeInvokeAfter()
                writer.raw(msg.data)
            }

            msg.sent = true
        }

        if (useContainer) {
            // we now need to assign the container msg_id and seqno
            // we couldn't have assigned them earlier because mtproto
            // requires them to be >= than the contained messages

            packetSize = writer.pos

            const containerId = this._session.getMessageId()
            const seqNo = this._session.getSeqNo(false)
            this.log.debug('container: msg_id assigned %l, seqno: %d', containerId, seqNo)
            writer.pos = 0
            rootMsgId = containerId
            writer.long(this._registerOutgoingMsgId(containerId))
            writer.uint(seqNo)
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

        this.log.debug(
            'sending %d messages: size = %db, acks = %L, ping = %b (msg_id = %l), state_req = %L (msg_id = %l), resend = %L (msg_id = %l), cancels = %L (msg_id = %l), salts_req = %b (msg_id = %l), rpc = %s, container = %b, root msg_id = %l',
            messageCount,
            packetSize,
            ackMsgIds,
            pingRequest,
            pingMsgId,
            getStateMsgIds,
            getStateMsgId,
            resendMsgIds,
            cancelRpcs,
            cancelRpcs,
            resendMsgId,
            getFutureSaltsRequest,
            getFutureSaltsMsgId,
            rpcToSend.map((it) => it.method),
            useContainer,
            rootMsgId,
        )

        const enc = this._session.encryptMessage(result)
        const promise = this.send(enc).catch((err: Error) => {
            this.log.error('error while sending pending messages (root msg_id = %l): %s', rootMsgId, err.stack)

            // put acks in the front so they are the first to be sent
            if (ackMsgIds) {
                this._session.queuedAcks.splice(0, 0, ...ackMsgIds)
            }
            if (rootMsgId) {
                this._onMessageFailed(rootMsgId, 'unknown error')
            }
        })

        if (this._inactivityPendingFlush && !this._session.hasPendingMessages) {
            void promise.then(() => {
                this.log.debug('pending messages sent, closing connection')
                this._flushTimer.reset()
                this._inactivityPendingFlush = false

                super._onInactivityTimeout()
            })
        }
    }
}
