import {
    CallbackQuery,
    ChatsIndex,
    InlineQuery,
    Message,
    MtCuteArgumentError,
    TelegramClient,
    UsersIndex,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import {
    ContinuePropagation,
    PropagationSymbol,
    StopChildrenPropagation,
    StopPropagation,
} from './propagation'
// begin-codegen-imports
import {
    UpdateHandler,
    RawUpdateHandler,
    NewMessageHandler,
    EditMessageHandler,
    DeleteMessageHandler,
    ChatMemberUpdateHandler,
    InlineQueryHandler,
    ChosenInlineResultHandler,
    CallbackQueryHandler,
    PollUpdateHandler,
    PollVoteHandler,
    UserStatusUpdateHandler,
    UserTypingHandler,
} from './handler'
// end-codegen-imports
import { filters, UpdateFilter } from './filters'
import { handlers } from './builders'
import { ChatMemberUpdate } from './updates'
import { ChosenInlineResult } from './updates/chosen-inline-result'
import { PollUpdate } from './updates/poll-update'
import { PollVoteUpdate } from './updates/poll-vote'
import { UserStatusUpdate } from './updates/user-status-update'
import { UserTypingUpdate } from './updates/user-typing-update'
import { DeleteMessageUpdate } from './updates/delete-message-update'

const noop = () => {}

type ParserFunction = (
    client: TelegramClient,
    upd: tl.TypeUpdate | tl.TypeMessage,
    users: UsersIndex,
    chats: ChatsIndex
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
        chats,
        upd._ === 'updateNewScheduledMessage'
    )

const newMessageParser: UpdateParser = ['new_message', baseMessageParser]
const editMessageParser: UpdateParser = ['edit_message', baseMessageParser]
const chatMemberParser: UpdateParser = [
    'chat_member',
    (client, upd, users, chats) =>
        new ChatMemberUpdate(client, upd as any, users, chats),
]
const callbackQueryParser: UpdateParser = [
    'callback_query',
    (client, upd, users) => new CallbackQuery(client, upd as any, users),
]
const userTypingParser: UpdateParser = [
    'user_typing',
    (client, upd) => new UserTypingUpdate(client, upd as any),
]
const deleteMessageParser: UpdateParser = [
    'delete_message',
    (client, upd) => new DeleteMessageUpdate(client, upd as any),
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
    updateBotInlineSend: [
        'chosen_inline_result',
        (client, upd, users) =>
            new ChosenInlineResult(client, upd as any, users),
    ],
    updateBotCallbackQuery: callbackQueryParser,
    updateInlineBotCallbackQuery: callbackQueryParser,
    updateMessagePoll: [
        'poll',
        (client, upd, users) => new PollUpdate(client, upd as any, users),
    ],
    updateMessagePollVote: [
        'poll_vote',
        (client, upd, users) => new PollVoteUpdate(client, upd as any, users),
    ],
    updateUserStatus: [
        'user_status',
        (client, upd) => new UserStatusUpdate(client, upd as any),
    ],
    updateChannelUserTyping: userTypingParser,
    updateChatUserTyping: userTypingParser,
    updateUserTyping: userTypingParser,
    updateDeleteChannelMessages: deleteMessageParser,
    updateDeleteMessages: deleteMessageParser,
}

const HANDLER_TYPE_TO_UPDATE: Record<string, string[]> = {}
Object.keys(PARSERS).forEach((upd: keyof typeof PARSERS) => {
    const handler = PARSERS[upd]![0]
    if (!(handler in HANDLER_TYPE_TO_UPDATE)) HANDLER_TYPE_TO_UPDATE[handler] = []
    HANDLER_TYPE_TO_UPDATE[handler].push(upd)
})

/**
 * Updates dispatcher
 */
export class Dispatcher {
    private _groups: Record<
        number,
        Record<UpdateHandler['type'], UpdateHandler[]>
    > = {}
    private _groupsOrder: number[] = []

    private _client?: TelegramClient

    private _parent?: Dispatcher
    private _children: Dispatcher[] = []

    private _handlersCount: Record<string, number> = {}

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
        users: UsersIndex,
        chats: ChatsIndex
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
        users: UsersIndex,
        chats: ChatsIndex
    ): Promise<void> {
        return this._dispatchUpdateNowImpl(update, users, chats)
    }

    private async _dispatchUpdateNowImpl(
        update: tl.TypeUpdate | tl.TypeMessage,
        users: UsersIndex,
        chats: ChatsIndex,
        parsed?: any,
        parsedType?: Exclude<UpdateHandler['type'], 'raw'> | null
    ): Promise<void> {
        if (!this._client) return

        const isRawMessage = tl.isAnyMessage(update)
        if (parsed === undefined && this._handlersCount[update._]) {
            const pair = PARSERS[update._]
            if (pair) {
                parsed = pair[1](this._client, update, users, chats)
                parsedType = pair[0]
            } else {
                parsed = parsedType = null
            }
        }

        outer: for (const grp of this._groupsOrder) {
            const group = this._groups[grp]

            let tryRaw = !isRawMessage

            if (parsedType && parsedType in group) {
                // raw is not handled here, so we can safely assume this
                const handlers = group[parsedType] as Exclude<
                    UpdateHandler,
                    RawUpdateHandler
                >[]

                for (const h of handlers) {
                    let result: void | PropagationSymbol

                    if (!h.check || (await h.check(parsed, this._client))) {
                        result = await h.callback(parsed, this._client)
                    } else continue

                    if (result === ContinuePropagation) continue
                    if (result === StopPropagation) break outer
                    if (result === StopChildrenPropagation) return

                    tryRaw = false
                    break
                }
            }

            if (tryRaw && 'raw' in group) {
                const handlers = group['raw'] as RawUpdateHandler[]

                for (const h of handlers) {
                    let result: void | PropagationSymbol

                    if (
                        !h.check ||
                        (await h.check(
                            this._client,
                            update as any,
                            users,
                            chats
                        ))
                    ) {
                        result = await h.callback(
                            this._client,
                            update as any,
                            users,
                            chats
                        )
                    } else continue

                    if (result === ContinuePropagation) continue
                    if (result === StopPropagation) break outer
                    if (result === StopChildrenPropagation) return

                    break
                }
            }
        }

        for (const child of this._children) {
            await child._dispatchUpdateNowImpl(
                update,
                users,
                chats,
                parsed,
                parsedType
            )
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
            this._groups[group] = {} as any
            this._groupsOrder.push(group)
            this._groupsOrder.sort((a, b) => a - b)
        }

        if (!(handler.type in this._groups[group])) {
            this._groups[group][handler.type] = []
        }

        HANDLER_TYPE_TO_UPDATE[handler.type].forEach((upd) => {
            if (!(upd in this._handlersCount)) this._handlersCount[upd] = 0
            this._handlersCount[upd] += 1
        })

        this._groups[group][handler.type].push(handler)
    }

    /**
     * Remove an update handler (or handlers) from a given
     * handler group.
     *
     * @param handler  Update handler to remove, its type or `'all'` to remove all
     * @param group  Handler group index (-1 to affect all groups)
     * @internal
     */
    removeUpdateHandler(
        handler: UpdateHandler | UpdateHandler['type'] | 'all',
        group = 0
    ): void {
        if (group !== -1 && !(group in this._groups)) {
            return
        }

        if (typeof handler === 'string') {
            if (handler === 'all') {
                if (group === -1) {
                    this._groups = {}
                    this._handlersCount = {}
                } else {
                    const grp = this._groups[group] as any
                    Object.keys(grp).forEach((handler) => {
                        HANDLER_TYPE_TO_UPDATE[handler].forEach((upd) => {
                            this._handlersCount[upd] -= grp[handler].length
                        })
                    })
                    delete this._groups[group]
                }
            } else {
                HANDLER_TYPE_TO_UPDATE[handler].forEach((upd) => {
                    this._handlersCount[upd] -= this._groups[group][handler].length
                })
                delete this._groups[group][handler]
            }
            return
        }

        if (!(handler.type in this._groups[group])) {
            return
        }

        const idx = this._groups[group][handler.type].indexOf(handler)
        if (idx > 0) {
            this._groups[group][handler.type].splice(idx, 1)

            HANDLER_TYPE_TO_UPDATE[handler.type].forEach((upd) => {
                this._handlersCount[upd] -= 1
            })
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
                this._groups[group] = other._groups[group]
                this._groupsOrder.push(group)
            } else {
                const otherGrp = other._groups[group] as any
                const selfGrp = this._groups[group] as any
                Object.keys(otherGrp).forEach((typ) => {
                    if (!(typ in selfGrp)) {
                        selfGrp[typ] = otherGrp[typ]
                    } else {
                        selfGrp[typ].push(...otherGrp[typ])
                    }
                })
            }
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

    // begin-codegen

    /**
     * Register a raw update handler without any filters
     *
     * @param handler  Raw update handler
     * @param group  Handler group index
     */
    onRawUpdate(handler: RawUpdateHandler['callback'], group?: number): void

    /**
     * Register a raw update handler with a filter
     *
     * @param filter  Update filter function
     * @param handler  Raw update handler
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
     * Register a new message handler without any filters
     *
     * @param handler  New message handler
     * @param group  Handler group index
     * @internal
     */
    onNewMessage(handler: NewMessageHandler['callback'], group?: number): void

    /**
     * Register a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
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
     * Register an edit message handler without any filters
     *
     * @param handler  Edit message handler
     * @param group  Handler group index
     * @internal
     */
    onEditMessage(handler: EditMessageHandler['callback'], group?: number): void

    /**
     * Register an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: EditMessageHandler<filters.Modify<Message, Mod>>['callback'],
        group?: number
    ): void

    /** @internal */
    onEditMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('editMessage', filter, handler, group)
    }

    /**
     * Register a delete message handler without any filters
     *
     * @param handler  Delete message handler
     * @param group  Handler group index
     * @internal
     */
    onDeleteMessage(
        handler: DeleteMessageHandler['callback'],
        group?: number
    ): void

    /**
     * Register a delete message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Delete message handler
     * @param group  Handler group index
     */
    onDeleteMessage<Mod>(
        filter: UpdateFilter<DeleteMessageUpdate, Mod>,
        handler: DeleteMessageHandler<
            filters.Modify<DeleteMessageUpdate, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onDeleteMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('deleteMessage', filter, handler, group)
    }

    /**
     * Register a chat member update handler without any filters
     *
     * @param handler  Chat member update handler
     * @param group  Handler group index
     * @internal
     */
    onChatMemberUpdate(
        handler: ChatMemberUpdateHandler['callback'],
        group?: number
    ): void

    /**
     * Register a chat member update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chat member update handler
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
     * Register an inline query handler without any filters
     *
     * @param handler  Inline query handler
     * @param group  Handler group index
     * @internal
     */
    onInlineQuery(handler: InlineQueryHandler['callback'], group?: number): void

    /**
     * Register an inline query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Inline query handler
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

    /**
     * Register a chosen inline result handler without any filters
     *
     * @param handler  Chosen inline result handler
     * @param group  Handler group index
     * @internal
     */
    onChosenInlineResult(
        handler: ChosenInlineResultHandler['callback'],
        group?: number
    ): void

    /**
     * Register a chosen inline result handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chosen inline result handler
     * @param group  Handler group index
     */
    onChosenInlineResult<Mod>(
        filter: UpdateFilter<ChosenInlineResult, Mod>,
        handler: ChosenInlineResultHandler<
            filters.Modify<ChosenInlineResult, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onChosenInlineResult(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('chosenInlineResult', filter, handler, group)
    }

    /**
     * Register a callback query handler without any filters
     *
     * @param handler  Callback query handler
     * @param group  Handler group index
     * @internal
     */
    onCallbackQuery(
        handler: CallbackQueryHandler['callback'],
        group?: number
    ): void

    /**
     * Register a callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Callback query handler
     * @param group  Handler group index
     */
    onCallbackQuery<Mod>(
        filter: UpdateFilter<CallbackQuery, Mod>,
        handler: CallbackQueryHandler<
            filters.Modify<CallbackQuery, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onCallbackQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('callbackQuery', filter, handler, group)
    }

    /**
     * Register a poll update handler without any filters
     *
     * @param handler  Poll update handler
     * @param group  Handler group index
     * @internal
     */
    onPollUpdate(handler: PollUpdateHandler['callback'], group?: number): void

    /**
     * Register a poll update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Poll update handler
     * @param group  Handler group index
     */
    onPollUpdate<Mod>(
        filter: UpdateFilter<PollUpdate, Mod>,
        handler: PollUpdateHandler<filters.Modify<PollUpdate, Mod>>['callback'],
        group?: number
    ): void

    /** @internal */
    onPollUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('pollUpdate', filter, handler, group)
    }

    /**
     * Register a poll vote handler without any filters
     *
     * @param handler  Poll vote handler
     * @param group  Handler group index
     * @internal
     */
    onPollVote(handler: PollVoteHandler['callback'], group?: number): void

    /**
     * Register a poll vote handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Poll vote handler
     * @param group  Handler group index
     */
    onPollVote<Mod>(
        filter: UpdateFilter<PollVoteUpdate, Mod>,
        handler: PollVoteHandler<
            filters.Modify<PollVoteUpdate, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onPollVote(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('pollVote', filter, handler, group)
    }

    /**
     * Register an user status update handler without any filters
     *
     * @param handler  User status update handler
     * @param group  Handler group index
     * @internal
     */
    onUserStatusUpdate(
        handler: UserStatusUpdateHandler['callback'],
        group?: number
    ): void

    /**
     * Register an user status update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  User status update handler
     * @param group  Handler group index
     */
    onUserStatusUpdate<Mod>(
        filter: UpdateFilter<UserStatusUpdate, Mod>,
        handler: UserStatusUpdateHandler<
            filters.Modify<UserStatusUpdate, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onUserStatusUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('userStatusUpdate', filter, handler, group)
    }

    /**
     * Register an user typing handler without any filters
     *
     * @param handler  User typing handler
     * @param group  Handler group index
     * @internal
     */
    onUserTyping(handler: UserTypingHandler['callback'], group?: number): void

    /**
     * Register an user typing handler with a filter
     *
     * @param filter  Update filter
     * @param handler  User typing handler
     * @param group  Handler group index
     */
    onUserTyping<Mod>(
        filter: UpdateFilter<UserTypingUpdate, Mod>,
        handler: UserTypingHandler<
            filters.Modify<UserTypingUpdate, Mod>
        >['callback'],
        group?: number
    ): void

    /** @internal */
    onUserTyping(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('userTyping', filter, handler, group)
    }

    // end-codegen
}
