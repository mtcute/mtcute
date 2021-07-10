import { Dispatcher } from './dispatcher'
import {
    FormattedString,
    InputMediaLike,
    InputPeerLike,
    MaybeAsync,
    Message,
    MtCuteArgumentError,
    TelegramClient,
    TimeoutError,
    tl,
} from '@mtcute/client'
import { AsyncLock, getMarkedPeerId } from '@mtcute/core'
import {
    ControllablePromise,
    createControllablePromise,
} from '@mtcute/core/src/utils/controllable-promise'
import { HistoryReadUpdate } from './updates'

interface OneWayLinkedListItem<T> {
    v: T
    n?: OneWayLinkedListItem<T>
}

class Queue<T> {
    first?: OneWayLinkedListItem<T>
    last?: OneWayLinkedListItem<T>

    length = 0

    constructor (readonly limit = 0) {
    }

    push(item: T): void {
        const it: OneWayLinkedListItem<T> = { v: item }
        if (!this.first) {
            this.first = this.last = it
        } else {
            this.last!.n = it
            this.last = it
        }

        this.length += 1

        if (this.limit) {
            while (this.first && this.length > this.limit) {
                this.first = this.first.n
                this.length -= 1
            }
        }
    }

    empty(): boolean {
        return this.first === undefined
    }

    peek(): T | undefined {
        return this.first?.v
    }

    pop(): T | undefined {
        if (!this.first) return undefined

        const it = this.first
        this.first = this.first.n
        if (!this.first) this.last = undefined

        this.length -= 1
        return it.v
    }

    removeBy(pred: (it: T) => boolean): void {
        if (!this.first) return

        let prev: OneWayLinkedListItem<T> | undefined = undefined
        let it = this.first
        while (it && !pred(it.v)) {
            if (!it.n) return

            prev = it
            it = it.n
        }

        if (!it) return

        if (prev) {
            prev.n = it.n
        } else {
            this.first = it.n
        }

        if (!this.first) this.last = undefined

        this.length -= 1
    }

    clear(): void {
        this.first = this.last = undefined
        this.length = 0
    }
}

interface QueuedHandler<T> {
    promise: ControllablePromise<T>
    check?: (update: T) => MaybeAsync<boolean>
    timeout?: NodeJS.Timeout
}

export class Conversation {
    private _inputPeer: tl.TypeInputPeer
    private _chatId: number
    private _client: TelegramClient
    private _started = false

    private _lastMessage?: number
    private _lastReceivedMessage?: number

    private _queuedNewMessage = new Queue<QueuedHandler<Message>>()
    private _pendingNewMessages = new Queue<Message>()
    private _lock = new AsyncLock()

    private _pendingEditMessage: Record<number, QueuedHandler<Message>> = {}
    private _recentEdits = new Queue<Message>(10)

    private _pendingRead: Record<number, QueuedHandler<void>> = {}

    constructor(
        readonly dispatcher: Dispatcher<any, any>,
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        return this._inputPeer
    }

    /**
     * Start the conversation
     */
    async start(): Promise<void> {
        if (this._started) return

        const client = this.dispatcher['_client']
        if (!client) {
            throw new MtCuteArgumentError(
                'Dispatcher is not bound to a client!'
            )
        }

        this._client = client
        this._started = true
        this._inputPeer = await client.resolvePeer(this.chat)
        this._chatId = getMarkedPeerId(this._inputPeer)

        this.dispatcher.on('new_message', this._onNewMessage)
        this.dispatcher.on('edit_message', this._onEditMessage)
        this.dispatcher.on('history_read', this._onHistoryRead)
    }

    /**
     * Stop the conversation
     */
    stop(): void {
        if (!this._started) return

        this.dispatcher.off('new_message', this._onNewMessage)
        this.dispatcher.off('edit_message', this._onEditMessage)
        this.dispatcher.off('history_read', this._onHistoryRead)

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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const res = await this._client.sendText(this._inputPeer, text, params)
        this._lastMessage = res.id
        return res
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const res = await this._client.sendMedia(this._inputPeer, media, params)
        this._lastMessage = res.id
        return res
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const res = await this._client.sendMediaGroup(
            this._inputPeer,
            medias,
            params
        )
        this._lastMessage = res[res.length - 1].id
        return res
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        if (message === null) {
            message = 0
        } else if (message === undefined) {
            message = this._lastMessage ?? 0
        }

        return this._client.readHistory(this._inputPeer, message, clearMentions)
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new TimeoutError())
                this._queuedNewMessage.removeBy((it) => it.promise === promise)
            }, timeout)
        }

        this._queuedNewMessage.push({
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
            throw new MtCuteArgumentError(
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const msgId = params?.message ?? this._lastReceivedMessage
        if (!msgId) {
            throw new MtCuteArgumentError(
                'Provide message for which to wait for edit for'
            )
        }

        const promise = createControllablePromise<Message>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (params?.timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new TimeoutError())
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
            throw new MtCuteArgumentError("Conversation hasn't started yet")
        }

        const msgId = message ?? this._lastMessage
        if (!msgId)
            throw new MtCuteArgumentError(
                'Provide message for which to wait for read for'
            )

        // check if the message is already read
        const dialog = await this._client.getPeerDialogs(this._inputPeer)
        if (dialog.lastRead >= msgId) return

        const promise = createControllablePromise<void>()

        let timer: NodeJS.Timeout | undefined = undefined
        if (timeout !== null) {
            timer = setTimeout(() => {
                promise.reject(new TimeoutError())
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

        if (this._queuedNewMessage.empty()) {
            this._pendingNewMessages.push(msg)
            return
        }

        const it = this._queuedNewMessage.peek()!

        // order does matter for new messages
        this._lock.acquire().then(async () => {
            try {
                if (!it.check || (await it.check(msg))) {
                    if (it.timeout) clearTimeout(it.timeout)
                    it.promise.resolve(msg)
                    this._queuedNewMessage.pop()
                }
            } catch (e) {
                this._client['_emitError'](e)
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
            this._recentEdits.push(msg)
            return
        }

        (async () => {
            if (!it.check || (await it.check(msg))) {
                if (it.timeout) clearTimeout(it.timeout)
                it.promise.resolve(msg)
                delete this._pendingEditMessage[msg.id]
            }
        })().catch((e) => this._client['_emitError'](e))
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
        if (this._pendingNewMessages.empty()) return

        let it
        while ((it = this._pendingNewMessages.pop())) {
            this._onNewMessage(it)
        }
    }

    private _processRecentEdits() {
        if (this._recentEdits.empty()) return

        let it = this._recentEdits.first
        do {
            if (!it) break
            this._onEditMessage(it.v, true)
        } while ((it = it.n))
    }
}
