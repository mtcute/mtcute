import {
    InlineQuery,
    Message,
    MtCuteArgumentError,
    TelegramClient,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import {
    ContinuePropagation,
    PropagationSymbol,
    StopChildrenPropagation,
    StopPropagation,
} from './propagation'
import {
    ChatMemberUpdateHandler, InlineQueryHandler,
    NewMessageHandler,
    RawUpdateHandler,
    UpdateHandler,
} from './handler'
import { filters, UpdateFilter } from './filters'
import { handlers } from './builders'
import { ChatMemberUpdate } from './updates'

const noop = () => {}

type ParserFunction = (
    client: TelegramClient,
    upd: tl.TypeUpdate | tl.TypeMessage,
    users: Record<number, tl.TypeUser>,
    chats: Record<number, tl.TypeChat>
) => any
type UpdateParser = [Exclude<UpdateHandler['type'], 'raw'>, ParserFunction]

const baseMessageParser: ParserFunction = (
    client: TelegramClient,
    upd,
    users,
    chats
) =>
    new Message(
        client,
        tl.isAnyMessage(upd) ? upd : (upd as any).message,
        users,
        chats
    )

const newMessageParser: UpdateParser = ['new_message', baseMessageParser]
const editMessageParser: UpdateParser = ['edit_message', baseMessageParser]
const chatMemberParser: UpdateParser = [
    'chat_member',
    (client, upd, users, chats) =>
        new ChatMemberUpdate(client, upd as any, users, chats),
]

const PARSERS: Partial<
    Record<(tl.TypeUpdate | tl.TypeMessage)['_'], UpdateParser>
> = {
    message: newMessageParser,
    messageEmpty: newMessageParser,
    messageService: newMessageParser,
    updateNewMessage: newMessageParser,
    updateNewChannelMessage: newMessageParser,
    updateNewScheduledMessage: newMessageParser,
    updateEditMessage: editMessageParser,
    updateEditChannelMessage: editMessageParser,
    updateChatParticipant: chatMemberParser,
    updateChannelParticipant: chatMemberParser,
    updateBotInlineQuery: [
        'inline_query',
        (client, upd, users) => new InlineQuery(client, upd as any, users),
    ],
}

/**
 * The dispatcher
 */
export class Dispatcher {
    private _groups: Record<number, UpdateHandler[]> = {}
    private _groupsOrder: number[] = []

    private _client?: TelegramClient

    private _parent?: Dispatcher
    private _children: Dispatcher[] = []

    /**
     * Create a new dispatcher, optionally binding it to the client.
     */
    constructor(client?: TelegramClient) {
        if (client) {
            this.bindToClient(client)
        }
    }

    /**
     * Bind the dispatcher to the client.
     * Called by the constructor automatically if
     * `client` was passed.
     *
     * Under the hood, this replaces client's `dispatchUpdate`
     * function, meaning you can't bind two different
     * dispatchers to the same client at the same time.
     * Instead, use {@link extend}, {@link addChild}
     * or {@link addScene} on the existing, already bound dispatcher.
     *
     * Dispatcher also uses bound client to throw errors
     */
    bindToClient(client: TelegramClient): void {
        client['dispatchUpdate'] = this.dispatchUpdate.bind(this)
        this._client = client
    }

    /**
     * Unbind a dispatcher from the client.
     *
     * This will replace client's dispatchUpdate with a no-op.
     * If this dispatcher is not bound, nothing will happen.
     */
    unbind(): void {
        if (this._client) {
            this._client['dispatchUpdate'] = noop
            this._client = undefined
        }
    }

    /**
     * Process an update with this dispatcher.
     * Calling this method without bound client will not work.
     *
     * Under the hood asynchronously calls {@link dispatchUpdateNow}
     * with error handler set to client's one.
     *
     * @param update  Update to process
     * @param users  Map of users
     * @param chats  Map of chats
     */
    dispatchUpdate(
        update: tl.TypeUpdate | tl.TypeMessage,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ): void {
        if (!this._client) return

        // order does not matter in the dispatcher,
        // so we can handle each update in its own task
        this.dispatchUpdateNow(update, users, chats).catch((err) =>
            this._client!['_emitError'](err)
        )
    }

    /**
     * Process an update right now in the current stack.
     *
     * Unlike {@link dispatchUpdate}, this does not schedule
     * the update to be dispatched, but dispatches it immediately,
     * and after `await`ing this method you can be certain that the update
     * was fully processed by all the registered handlers, including children.
     *
     * @param update  Update to process
     * @param users  Map of users
     * @param chats  Map of chats
     */
    async dispatchUpdateNow(
        update: tl.TypeUpdate | tl.TypeMessage,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ): Promise<void> {
        if (!this._client) return

        const isRawMessage = tl.isAnyMessage(update)
        const pair = PARSERS[update._]
        const parsed = pair
            ? pair[1](this._client, update, users, chats)
            : undefined

        outer: for (const grp of this._groupsOrder) {
            for (const handler of this._groups[grp]) {
                let result: void | PropagationSymbol

                if (
                    handler.type === 'raw' &&
                    !isRawMessage &&
                    (!handler.check ||
                        (await handler.check(
                            this._client,
                            update as any,
                            users,
                            chats
                        )))
                ) {
                    result = await handler.callback(
                        this._client,
                        update as any,
                        users,
                        chats
                    )
                } else if (
                    pair &&
                    handler.type === pair[0] &&
                    (!handler.check ||
                        (await handler.check(parsed, this._client)))
                ) {
                    result = await handler.callback(parsed, this._client)
                } else continue

                if (result === ContinuePropagation) continue
                if (result === StopPropagation) break outer
                if (result === StopChildrenPropagation) return

                break
            }
        }

        for (const child of this._children) {
            await child.dispatchUpdateNow(update, users, chats)
        }
    }

    /**
     * Add an update handler to a given handlers group
     *
     * @param handler  Update handler
     * @param group  Handler group index
     */
    addUpdateHandler(handler: UpdateHandler, group = 0): void {
        if (!(group in this._groups)) {
            this._groups[group] = []
            this._groupsOrder.push(group)
            this._groupsOrder.sort((a, b) => a - b)
        }

        this._groups[group].push(handler)
    }

    /**
     * Remove an update handler (or handlers) from a given
     * handler group.
     *
     * @param handler  Update handler to remove, its type or `'all'` to remove all
     * @param group  Handler group index
     * @internal
     */
    removeUpdateHandler(
        handler: UpdateHandler | UpdateHandler['type'] | 'all',
        group = 0
    ): void {
        if (!(group in this._groups)) {
            return
        }

        if (typeof handler === 'string') {
            if (handler === 'all') {
                delete this._groups[group]
            } else {
                this._groups[group] = this._groups[group].filter(
                    (h) => h.type !== handler
                )
            }
            return
        }

        if (!(handler.type in this._groups[group])) {
            return
        }

        const idx = this._groups[group].indexOf(handler)
        if (idx > 0) {
            this._groups[group].splice(idx, 1)
        }
    }

    // children //

    /**
     * Get parent dispatcher if current dispatcher is a child.
     * Otherwise, return `null`
     */
    get parent(): Dispatcher | null {
        return this._parent ?? null
    }

    /**
     * Add a child dispatcher.
     *
     * Child dispatchers are called when dispatching updates
     * just like normal, except they can be controlled
     * externally. Additionally, child dispatcher have their own
     * independent handler grouping that does not interfere with parent's,
     * including `StopPropagation` (i.e. returning `StopPropagation` will
     * still call children. To entirely stop, use `StopChildrenPropagation`)
     *
     * Note that child dispatchers share the same TelegramClient
     * binding as the parent, don't bind them manually.
     *
     * @param other  Other dispatcher
     */
    addChild(other: Dispatcher): void {
        if (this._children.indexOf(other) > -1) return

        if (other._client) {
            throw new MtCuteArgumentError(
                'Provided dispatcher is ' +
                    (other._parent
                        ? 'already a child. Use parent.removeChild() before calling addChild()'
                        : 'already bound to a client. Use unbind() before calling addChild()')
            )
        }

        other._parent = this
        other._client = this._client
        this._children.push(other)
    }

    /**
     * Remove a child dispatcher.
     *
     * Removing child dispatcher will also remove
     * child dispatcher's client binding.
     *
     * If the provided dispatcher is not a child of current,
     * this function will silently fail.
     *
     * @param other  Other dispatcher
     */
    removeChild(other: Dispatcher): void {
        const idx = this._children.indexOf(other)
        if (idx > -1) {
            other._parent = undefined
            other._client = undefined
            this._children.splice(idx, 1)
        }
    }

    /**
     * Extend current dispatcher by copying other dispatcher's
     * handlers and children to the current.
     *
     * This might be more efficient for simple cases, but do note that the handler
     * groups will get merged (unlike {@link addChild}, where they
     * are independent). Also note that unlike with children,
     * when adding handlers to `other` *after* you extended
     * the current dispatcher, changes will not be applied.
     *
     * @param other  Other dispatcher
     */
    extend(other: Dispatcher): void {
        other._groupsOrder.forEach((group) => {
            if (!(group in this._groups)) {
                this._groups[group] = []
                this._groupsOrder.push(group)
            }
            this._groups[group].push(...other._groups[group])
        })

        this._groupsOrder.sort((a, b) => a - b)
    }

    // addUpdateHandler convenience wrappers //

    private _addKnownHandler(
        name: keyof typeof handlers,
        filter: any,
        handler?: any,
        group?: number
    ): void {
        if (typeof handler === 'number') {
            this.addUpdateHandler((handlers as any)[name](filter), handler)
        } else {
            this.addUpdateHandler(
                (handlers as any)[name](filter, handler),
                group
            )
        }
    }

    /**
     * Register a raw update handler
     *
     * @param handler  Handler function
     * @param group  Handler group index
     */
    onRawUpdate(handler: RawUpdateHandler['callback'], group?: number): void

    /**
     * Register a filtered raw update handler
     *
     * @param filter  Update filter function
     * @param handler  Handler function
     * @param group  Handler group index
     */
    onRawUpdate(
        filter: RawUpdateHandler['check'],
        handler: RawUpdateHandler['callback'],
        group?: number
    ): void

    /** @internal */
    onRawUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('rawUpdate', filter, handler, group)
    }

    /**
     * Register a message handler without any filters.
     *
     * @param handler  Message handler
     * @param group  Handler group index
     * @internal
     */
    onNewMessage(handler: NewMessageHandler['callback'], group?: number): void

    /**
     * Register a message handler with a given filter
     *
     * @param filter  Update filter
     * @param handler  Message handler
     * @param group  Handler group index
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: NewMessageHandler<filters.Modify<Message, Mod>>['callback'],
        group?: number
    ): void

    /** @internal */
    onNewMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('newMessage', filter, handler, group)
    }

    /**
     * Register a chat member update handler without any filters.
     *
     * @param handler  Update handler
     * @param group  Handler group index
     * @internal
     */
    onChatMemberUpdate(
        handler: ChatMemberUpdateHandler['callback'],
        group?: number
    ): void

    /**
     * Register a message handler with a given filter
     *
     * @param filter  Update filter
     * @param handler  Update handler
     * @param group  Handler group index
     */
    onChatMemberUpdate<Mod>(
        filter: UpdateFilter<ChatMemberUpdate, Mod>,
        handler: ChatMemberUpdateHandler<
            filters.Modify<ChatMemberUpdate, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onChatMemberUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('chatMemberUpdate', filter, handler, group)
    }

    /**
     * Register an inline query handler without any filters.
     *
     * @param handler  Update handler
     * @param group  Handler group index
     * @internal
     */
    onInlineQuery(
        handler: InlineQueryHandler['callback'],
        group?: number
    ): void

    /**
     * Register an inline query handler with a given filter
     *
     * @param filter  Update filter
     * @param handler  Update handler
     * @param group  Handler group index
     */
    onInlineQuery<Mod>(
        filter: UpdateFilter<InlineQuery, Mod>,
        handler: InlineQueryHandler<
            filters.Modify<InlineQuery, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onInlineQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('inlineQuery', filter, handler, group)
    }
}
