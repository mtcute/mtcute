import { AsyncLock, Deque, getMarkedPeerId, MaybeAsync } from '@mtcute/core'
import {
    ControllablePromise,
    createControllablePromise,
} from '@mtcute/core/src/utils/controllable-promise'
import { TelegramClient } from '../client'
import { InputMediaLike } from './media'
import { MtArgumentError } from './errors'
import { InputPeerLike } from './peers'
import { HistoryReadUpdate } from './updates'
import { FormattedString } from './parser'
import { Message } from './messages'
import { tl } from '@mtcute/tl'

interface QueuedHandler<T> {
    promise: ControllablePromise<T>
    check?: (update: T) => MaybeAsync<boolean>
    timeout?: NodeJS.Timeout
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

    private _pendingEditMessage: Record<number, QueuedHandler<Message>> = {}
    private _recentEdits = new Deque<Message>(10)

    private _pendingRead: Record<number, QueuedHandler<void>> = {}

    constructor(
        readonly client: TelegramClient,
        readonly chat: InputPeerLike
    ) {
        this._onNewMessage = this._onNewMessage.bind(this)
        this._onEditMessage = this._onEditMessage.bind(this)
        this._onHistoryRead = this._onHistoryRead.bind(this)
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
        this._inputPeer = await this.client.resolvePeer(this.chat)
        this._chatId = getMarkedPeerId(this._inputPeer)

        const dialog = await this.client.getPeerDialogs(this._inputPeer)
        this._lastMessage = this._lastReceivedMessage = dialog.lastMessage.id

        this.client.on('new_message', this._onNewMessage)
        this.client.on('edit_message', this._onEditMessage)
        this.client.on('history_read', this._onHistoryRead)

        if (!(this._chatId in this.client['_pendingConversations'])) {
            this.client['_pendingConversations'][this._chatId] = []
        }
        this.client['_pendingConversations'][this._chatId].push(this)
        this.client['_hasConversations'] = true
    }

    /**
     * Stop the conversation
     */
    stop(): void {
        if (!this._started) return

        this.client.off('new_message', this._onNewMessage)
        this.client.off('edit_message', this._onEditMessage)
        this.client.off('history_read', this._onHistoryRead)

        const idx = this.client['_pendingConversations'][this._chatId].indexOf(this)
        if (idx > -1) { // just in case
            this.client['_pendingConversations'][this._chatId].splice(idx, 1)
        }
        if (!this.client['_pendingConversations'][this._chatId].length) {
            delete this.client['_pendingConversations'][this._chatId]
        }
        this.client['_hasConversations'] = Object.keys(this.client['_pendingConversations']).length > 0

        // reset pending status
        this._queuedNewMessage.clear()
        this._pendingNewMessages.clear()
        this._pendingEditMessage = {}
        this._recentEdits.clear()
        this._pendingRead = {}

        this._started = false
    }

    /**
     * Send a text message to this conversation.
     *
     * @param text  Text of the message
     * @param params
     */
    async sendText(
        text: string | FormattedString,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this.client.sendText(this._inputPeer, text, params)
    }

    /**
     * Send a media to this conversation.
     *
     * @param media  Media to send
     * @param params
     */
    async sendMedia(
        media: InputMediaLike | string,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this.client.sendMedia(this._inputPeer, media, params)
    }

    /**
     * Send a media group to this conversation.
     *
     * @param medias  Medias to send
     * @param params
     */
    async sendMediaGroup(
        medias: (InputMediaLike | string)[],
        params?: Parameters<TelegramClient['sendMediaGroup']>[2]
    ): ReturnType<TelegramClient['sendMediaGroup']> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        return this.client.sendMediaGroup(
            this._inputPeer,
            medias,
            params
        )
    }

    /**
     * Mark the conversation as read up to a certain point.
     *
     * By default, reads until the last message.
     * You can pass `null` to read the entire conversation,
     * or pass message ID to read up until that ID.
     */
    markRead(message?: number | null, clearMentions = true): Promise<void> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        if (message === null) {
            message = 0
        } else if (message === undefined) {
            message = this._lastMessage ?? 0
        }

        return this.client.readHistory(this._inputPeer, message, clearMentions)
    }

    /**
     * Helper method that calls {@link start},
     * the provided function and the {@link stop}.
     *
     * It is preferred that you use this function rather than
     * manually starting and stopping the conversation.
     *
     * If you don't stop the conversation, this *will* lead to memory leaks.
     *
     * @param handler
     */
    async with<T>(handler: () => MaybeAsync<T>): Promise<T> {
        await this.start()

        let err: unknown
        let res: T
        try {
            res = await handler()
        } catch (e) {
            err = e
        }

        this.stop()

        if (err) throw err

        return res!
    }

    /**
     * Wait for a new message in the conversation
     *
     * @param filter  Filter for the handler. You can use any filter you can use for dispatcher
     * @param timeout  Timeout for the handler in ms, def. 15 sec. Pass `null` to disable.
     *   When the timeout is reached, `TimeoutError` is thrown.
     */
    waitForNewMessage(
        filter?: (msg: Message) => MaybeAsync<boolean>,
        timeout: number | null = 15000
    ): Promise<Message> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new tl.errors.TimeoutError())
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
        filter?: (msg: Message) => MaybeAsync<boolean>,
        params?: {
            /**
             * Message for which to wait for response for.
             *
             * Defaults to last sent/received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * Defaults to `15000` (15 sec)
             */
            timeout?: number | null
        }
    ): Promise<Message> {
        const msgId = params?.message ?? this._lastMessage ?? 0

        const pred = filter
            ? (msg: Message) => (msg.id > msgId ? filter(msg) : false)
            : (msg: Message) => msg.id > msgId

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
        filter?: (msg: Message) => MaybeAsync<boolean>,
        params?: {
            /**
             * Message for which to wait for reply for.
             *
             * Defaults to last sent/received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * Defaults to `15000` (15 sec)
             */
            timeout?: number | null
        }
    ): Promise<Message> {
        const msgId = params?.message ?? this._lastMessage
        if (!msgId)
            throw new MtArgumentError(
                'Provide message for which to wait for reply for'
            )

        const pred = filter
            ? (msg: Message) =>
                  msg.replyToMessageId === msgId ? filter(msg) : false
            : (msg: Message) => msg.replyToMessageId === msgId

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
        filter?: (msg: Message) => MaybeAsync<boolean>,
        params?: {
            /**
             * Message for which to wait for reply for.
             *
             * Defaults to last received message
             */
            message?: number

            /**
             * Timeout for the handler in ms. Pass `null` to disable.
             *
             * When the timeout is reached, `TimeoutError` is thrown.
             *
             * Defaults to `15000` (15 sec)
             */
            timeout?: number | null
        }
    ): Promise<Message> {
        if (!this._started) {
            throw new MtArgumentError("Conversation hasn't started yet")
        }

        const msgId = params?.message ?? this._lastReceivedMessage
        if (!msgId) {
            throw new MtArgumentError(
                'Provide message for which to wait for edit for'
            )
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (params?.timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new tl.errors.TimeoutError())
                delete this._pendingEditMessage[msgId]
            }, params?.timeout ?? 15000)
        }

        this._pendingEditMessage[msgId] = {
            promise,
            check: filter,
            timeout: timer,
        }

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
        if (!msgId)
            throw new MtArgumentError(
                'Provide message for which to wait for read for'
            )

        // check if the message is already read
        const dialog = await this.client.getPeerDialogs(this._inputPeer)
        if (dialog.lastRead >= msgId) return

        const promise = createControllablePromise<void>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new tl.errors.TimeoutError())
                delete this._pendingRead[msgId]
            }, timeout)
        }

        this._pendingRead[msgId] = {
            promise,
            timeout: timer,
        }

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
        this._lock.acquire().then(async () => {
            try {
                if (!it.check || (await it.check(msg))) {
                    if (it.timeout) clearTimeout(it.timeout)
                    it.promise.resolve(msg)
                    this._queuedNewMessage.popFront()
                }
            } catch (e: any) {
                this.client['_emitError'](e)
            }

            this._lastMessage = this._lastReceivedMessage = msg.id

            // this func will *never* error, so no need to use .then
            this._lock.release()
        })
    }

    private _onEditMessage(msg: Message, fromRecent = false) {
        if (msg.chat.id !== this._chatId) return

        const it = this._pendingEditMessage[msg.id]
        if (!it && !fromRecent) {
            this._recentEdits.pushBack(msg)
            return
        }

        (async () => {
            if (!it.check || (await it.check(msg))) {
                if (it.timeout) clearTimeout(it.timeout)
                it.promise.resolve(msg)
                delete this._pendingEditMessage[msg.id]
            }
        })().catch((e) => this.client['_emitError'](e))
    }

    private _onHistoryRead(upd: HistoryReadUpdate) {
        if (upd.chatId !== this._chatId) return

        const lastRead = upd.maxReadId

        Object.keys(this._pendingRead).forEach((msgId: any) => {
            if (parseInt(msgId) <= lastRead) {
                const it = this._pendingRead[msgId]
                if (it.timeout) clearTimeout(it.timeout)
                it.promise.resolve()
                delete this._pendingRead[msgId]
            }
        })
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
