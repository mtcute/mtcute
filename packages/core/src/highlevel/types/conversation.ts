import { tl } from '@mtcute/tl'

import { MtArgumentError, MtTimeoutError } from '../../types/errors.js'
import { MaybePromise } from '../../types/utils.js'
import { AsyncLock } from '../../utils/async-lock.js'
import { ControllablePromise, createControllablePromise } from '../../utils/controllable-promise.js'
import { Deque } from '../../utils/deque.js'
import { getMarkedPeerId } from '../../utils/peer-utils.js'
import { ITelegramClient } from '../client.types.js'
import { getPeerDialogs } from '../methods/dialogs/get-peer-dialogs.js'
import { readHistory } from '../methods/messages/read-history.js'
import { sendMedia } from '../methods/messages/send-media.js'
import { sendMediaGroup } from '../methods/messages/send-media-group.js'
import { sendText } from '../methods/messages/send-text.js'
import { resolvePeer } from '../methods/users/resolve-peer.js'
import type { Message } from './messages/message.js'
import type { InputPeerLike } from './peers/index.js'
import type { HistoryReadUpdate, ParsedUpdate } from './updates/index.js'
import { ParametersSkip2 } from './utils.js'

interface QueuedHandler<T> {
    promise: ControllablePromise<T>
    check?: (update: T) => MaybePromise<boolean>
    timeout?: NodeJS.Timeout
}

const CONVERSATION_SYMBOL = Symbol('conversation')

interface ConversationsState {
    pendingConversations: Map<number, Conversation[]>
    hasConversations: boolean
}

/**
 * Represents a conversation inside some chat.
 *
 * A conversation keeps track of any messages sent or edited
 * since it was started and until it was stopped,
 * and allows waiting for events in it.
 *
 * If you need a conversation across multiple chats,
 * you should use multiple {@link Conversation} objects
 * and synchronize them manually.
 */
export class Conversation {
    private _inputPeer!: tl.TypeInputPeer
    private _chatId!: number
    private _started = false

    private _lastMessage!: number
    private _lastReceivedMessage!: number

    private _queuedNewMessage = new Deque<QueuedHandler<Message>>()
    private _pendingNewMessages = new Deque<Message>()
    private _lock = new AsyncLock()

    private _pendingEditMessage: Map<number, QueuedHandler<Message>> = new Map()
    private _recentEdits = new Deque<Message>(10)

    private _pendingRead: Map<number, QueuedHandler<void>> = new Map()

    constructor(
        readonly client: ITelegramClient,
        readonly chat: InputPeerLike,
    ) {
        if (!(CONVERSATION_SYMBOL in client)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (client as any)[CONVERSATION_SYMBOL] = {
                pendingConversations: new Map(),
                hasConversations: false,
            } satisfies ConversationsState
        }
    }

    private static _getState(client: ITelegramClient): ConversationsState {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (client as any)[CONVERSATION_SYMBOL] as ConversationsState
    }

    /**
     * Pass the update to the conversation manager and all registered
     * conversations on this client.
     *
     * @returns `true` if the update was handled by some conversation
     */
    static handleUpdate(client: ITelegramClient, update: ParsedUpdate): boolean {
        const state = Conversation._getState(client)
        if (!state?.hasConversations) return false

        let chatId

        switch (update.name) {
            case 'new_message':
            case 'edit_message':
                chatId = getMarkedPeerId(update.data.raw.peerId)
                break
            case 'history_read':
                chatId = update.data.chatId
                break
            default:
                return false
        }

        const conv = state.pendingConversations.get(chatId)
        if (!conv) return false

        for (const c of conv) {
            switch (update.name) {
                case 'new_message':
                    c._onNewMessage(update.data)

                    return true
                case 'edit_message':
                    c._onEditMessage(update.data)

                    return true
                case 'history_read':
                    c._onHistoryRead(update.data)

                    return true
            }
        }

        return false
    }

    /**
     * Get the input peer that this conversation is with
     */
    get inputPeer(): tl.TypeInputPeer {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this._inputPeer
    }

    /**
     * ID of the very last message in this conversation.
     */
    get lastMessage(): number {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this._lastMessage
    }

    /**
     * ID of the last incoming message in this conversation.
     *
     * Note that before any messages were received since the {@link start}
     * of the conversation, this will equal to {@link lastMessage}
     */
    get lastReceivedMessage(): number {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this._lastReceivedMessage
    }

    /**
     * Start the conversation
     */
    async start(): Promise<void> {
        if (this._started) return

        this._started = true
        this._inputPeer = await resolvePeer(this.client, this.chat)
        this._chatId = getMarkedPeerId(this._inputPeer)

        const [dialog] = await getPeerDialogs(this.client, this._inputPeer)

        const lastMessage = dialog?.lastMessage

        if (lastMessage) {
            this._lastMessage = this._lastReceivedMessage = lastMessage.id
        } else {
            this._lastMessage = this._lastReceivedMessage = 0
        }

        const state = Conversation._getState(this.client)

        if (!state.pendingConversations.has(this._chatId)) {
            state.pendingConversations.set(this._chatId, [])
        }
        state.pendingConversations.get(this._chatId)!.push(this)
        state.hasConversations = true
    }

    /**
     * Stop the conversation
     */
    stop(): void {
        if (!this._started) return

        const state = Conversation._getState(this.client)

        const pending = state.pendingConversations.get(this._chatId)
        const pendingIdx = pending?.indexOf(this) ?? -1

        if (pendingIdx > -1) {
            // just in case
            pending!.splice(pendingIdx, 1)
        }
        if (pending && !pending.length) {
            state.pendingConversations.delete(this._chatId)
        }
        state.hasConversations = Boolean(state.pendingConversations.size)

        // reset pending status
        this._queuedNewMessage.clear()
        this._pendingNewMessages.clear()
        this._pendingEditMessage.clear()
        this._recentEdits.clear()
        this._pendingRead.clear()

        this._started = false
    }

    private _recordMessage(msg: Message, incoming = false): Message {
        this._lastMessage = msg.id
        if (incoming) this._lastReceivedMessage = msg.id

        return msg
    }

    /**
     * Send a text message to this conversation.
     *
     * Wrapper over {@link sendText}
     */
    async sendText(...params: ParametersSkip2<typeof sendText>): ReturnType<typeof sendText> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this._recordMessage(await sendText(this.client, this._inputPeer, ...params))
    }

    /**
     * Send a media to this conversation.
     *
     * Wrapper over {@link sendMedia}
     */
    async sendMedia(...params: ParametersSkip2<typeof sendMedia>): ReturnType<typeof sendMedia> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this._recordMessage(await sendMedia(this.client, this._inputPeer, ...params))
    }

    /**
     * Send a media group to this conversation.
     *
     * Wrapper over {@link sendMediaGroup}
     */
    async sendMediaGroup(...params: ParametersSkip2<typeof sendMediaGroup>): ReturnType<typeof sendMediaGroup> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const msgs = await sendMediaGroup(this.client, this._inputPeer, ...params)

        this._recordMessage(msgs[msgs.length - 1])

        return msgs
    }

    /**
     * Mark the conversation as read up to a certain point.
     *
     * By default, reads until the last message.
     * You can pass `message=null` to read the entire conversation,
     * or pass message ID to read up until that ID.
     */
    markRead({
        message,
        clearMentions = true,
    }: { message?: number | null; clearMentions?: boolean } = {}): Promise<void> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        if (message === null) {
            message = 0
        } else if (message === undefined) {
            message = this._lastMessage ?? 0
        }

        return readHistory(this.client, this._inputPeer, { maxId: message, clearMentions })
    }

    /**
     * Helper method that calls {@link start},
     * the provided function and then {@link stop}.
     *
     * It is preferred that you use this function rather than
     * manually starting and stopping the conversation.
     *
     * If you don't stop the conversation when you're done,
     * it *will* lead to memory leaks.
     *
     * @param handler
     */
    async with<T>(handler: () => MaybePromise<T>): Promise<T> {
        await this.start()

        let err: unknown
        let res: T

        try {
            res = await handler()
        } catch (e) {
            err = e
        }

        this.stop()

        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (err) throw err

        return res!
    }

    /**
     * Wait for a new message in the conversation
     *
     * @param filter  Filter for the handler. You can use any filter you can use for dispatcher
     * @param [timeout=15000]  Timeout for the handler in ms. Pass `null` to disable.
     *   When the timeout is reached, `MtTimeoutError` is thrown.
     */
    waitForNewMessage(
        filter?: (msg: Message) => MaybePromise<boolean>,
        timeout: number | null = 15000,
    ): Promise<Message> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined

        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new MtTimeoutError(timeout))
                this._queuedNewMessage.removeBy((it) => it.promise === promise)
            }, timeout)
        }

        this._queuedNewMessage.pushBack({
            promise,
            check: filter,
            timeout: timer,
        })

        this._processPendingNewMessages()

        return promise
    }

    /**
     * Wait for a response for the given message
     * (def. the last one) in the conversation.
     *
     * A message is considered to be a response if
     * it was sent after the given one.
     *
     * @param filter  Filter for the handler. You can use any filter you can use for dispatcher
     * @param params
     */
    waitForResponse(
        filter?: (msg: Message) => MaybePromise<boolean>,
        params?: {
            /**
             * Message for which to wait for response for.
             *
             * @default  last sent/received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * @default  `15000` (15 sec)
             */
            timeout?: number | null
        },
    ): Promise<Message> {
        const msgId = params?.message ?? this._lastMessage ?? 0

        const pred = filter ?
            (msg: Message) => (msg.id > msgId ? filter(msg) : false) :
            (msg: Message) => msg.id > msgId

        return this.waitForNewMessage(pred, params?.timeout)
    }

    /**
     * Wait for the reply for the given message'
     * (def. the last one) in the conversation.
     *
     * @param filter  Filter for the handler. You can use any filter you can use for dispatcher
     * @param params
     */
    waitForReply(
        filter?: (msg: Message) => MaybePromise<boolean>,
        params?: {
            /**
             * Message for which to wait for reply for.
             *
             * @default  last sent/received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * @default  `15000` (15 sec)
             */
            timeout?: number | null
        },
    ): Promise<Message> {
        const msgId = params?.message ?? this._lastMessage

        if (!msgId) {
            throw new MtArgumentError('Provide message for which to wait for reply for')
        }

        const pred = filter ?
            (msg: Message) => (msg.replyToMessage?.id === msgId ? filter(msg) : false) :
            (msg: Message) => msg.replyToMessage?.id === msgId

        return this.waitForNewMessage(pred, params?.timeout)
    }

    /**
     * Wait for a message to be edited in the conversation.
     * By defaults wait for the last message sent by the other party
     * (at the moment) to be edited.
     *
     * Returns the edited message.
     *
     * @param filter  Filter for the handler. You can use any filter you can use for dispatcher
     * @param params
     */
    async waitForEdit(
        filter?: (msg: Message) => MaybePromise<boolean>,
        params?: {
            /**
             * Message for which to wait for reply for.
             *
             * @default  last received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * @default  `15000` (15 sec)
             */
            timeout?: number | null
        },
    ): Promise<Message> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const msgId = params?.message ?? this._lastReceivedMessage

        if (!msgId) {
            throw new MtArgumentError('Provide message for which to wait for edit for')
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined
        const timeout = params?.timeout

        if (timeout) {
            timer = setTimeout(() => {
                promise.reject(new MtTimeoutError(timeout))
                this._pendingEditMessage.delete(msgId)
            }, timeout)
        }

        this._pendingEditMessage.set(msgId, {
            promise,
            check: filter,
            timeout: timer,
        })

        this._processRecentEdits()

        return promise
    }

    /**
     * Wait for the message to be read by the other party.
     *
     * Note that reading the message doesn't mean the response was sent,
     * and if the response was sent, it doesn't mean that the message was read.
     *
     * @param message  Message for which to wait for read for. Defaults to last message.
     * @param timeout  Timeout for the handler in ms, def. 15 sec. Pass `null` to disable.
     *   When the timeout is reached, `TimeoutError` is thrown.
     */
    async waitForRead(message?: number, timeout: number | null = 15000): Promise<void> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const msgId = message ?? this._lastMessage

        if (!msgId) {
            throw new MtArgumentError('Provide message for which to wait for read for')
        }

        // check if the message is already read
        const [dialog] = await getPeerDialogs(this.client, this._inputPeer)
        if (dialog.lastRead >= msgId) return

        const promise = createControllablePromise<void>()

        let timer: NodeJS.Timeout | undefined = undefined

        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new MtTimeoutError(timeout))
                this._pendingRead.delete(msgId)
            }, timeout)
        }

        this._pendingRead.set(msgId, {
            promise,
            timeout: timer,
        })

        return promise
    }

    private _onNewMessage(msg: Message) {
        if (msg.chat.id !== this._chatId) return

        if (!this._queuedNewMessage.length) {
            this._pendingNewMessages.pushBack(msg)

            return
        }

        const it = this._queuedNewMessage.peekFront()!

        // order does matter for new messages
        void this._lock.acquire().then(async () => {
            try {
                if (!it.check || (await it.check(msg))) {
                    if (it.timeout) clearTimeout(it.timeout)
                    it.promise.resolve(msg)
                    this._queuedNewMessage.popFront()
                }
            } catch (e: unknown) {
                this.client.emitError(e)
            }

            this._lastMessage = this._lastReceivedMessage = msg.id

            // this func will *never* error, so no need to use .then
            this._lock.release()
        })
    }

    private _onEditMessage(msg: Message, fromRecent = false) {
        if (msg.chat.id !== this._chatId) return

        const it = this._pendingEditMessage.get(msg.id)

        if (!it) {
            if (!fromRecent) {
                this._recentEdits.pushBack(msg)
            }

            return
        }

        (async () => {
            if (!it.check || (await it.check(msg))) {
                if (it.timeout) clearTimeout(it.timeout)
                it.promise.resolve(msg)
                this._pendingEditMessage.delete(msg.id)
            }
        })().catch((e) => {
            this.client.emitError(e)
        })
    }

    private _onHistoryRead(upd: HistoryReadUpdate) {
        if (upd.chatId !== this._chatId) return

        const lastRead = upd.maxReadId

        for (const msgId of this._pendingRead.keys()) {
            if (msgId <= lastRead) {
                const it = this._pendingRead.get(msgId)!
                if (it.timeout) clearTimeout(it.timeout)
                it.promise.resolve()
                this._pendingRead.delete(msgId)
            }
        }
    }

    private _processPendingNewMessages() {
        if (!this._pendingNewMessages.length) return

        let it

        while ((it = this._pendingNewMessages.popFront())) {
            this._onNewMessage(it)
        }
    }

    private _processRecentEdits() {
        if (!this._recentEdits.length) return

        const iter = this._recentEdits.iter()
        let it

        while (!(it = iter.next()).done) {
            this._onEditMessage(it.value, true)
        }
    }
}
