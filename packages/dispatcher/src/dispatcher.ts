/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
    CallbackQuery,
    ChatsIndex,
    InlineQuery,
    MaybeAsync,
    Message,
    MtCuteArgumentError,
    TelegramClient,
    UsersIndex,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
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
import { UpdateInfoForError } from './handler'
import { filters, UpdateFilter } from './filters'
import { handlers } from './builders'
import { ChatMemberUpdate } from './updates'
import { ChosenInlineResult } from './updates/chosen-inline-result'
import { PollUpdate } from './updates/poll-update'
import { PollVoteUpdate } from './updates/poll-vote'
import { UserStatusUpdate } from './updates/user-status-update'
import { UserTypingUpdate } from './updates/user-typing-update'
import { DeleteMessageUpdate } from './updates/delete-message-update'
import { IStateStorage, UpdateState, StateKeyDelegate } from './state'
import { defaultStateKeyDelegate } from './state/key'
import { PropagationAction } from './propagation'

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
    if (!(handler in HANDLER_TYPE_TO_UPDATE))
        HANDLER_TYPE_TO_UPDATE[handler] = []
    HANDLER_TYPE_TO_UPDATE[handler].push(upd)
})

/**
 * Updates dispatcher
 */
export class Dispatcher<State = never, SceneName extends string = string> {
    private _groups: Record<
        number,
        Record<UpdateHandler['type'], UpdateHandler[]>
    > = {}
    private _groupsOrder: number[] = []

    private _client?: TelegramClient

    private _parent?: Dispatcher<any>
    private _children: Dispatcher<any>[] = []

    private _scenes: Record<string, Dispatcher<any, SceneName>>
    private _scene?: SceneName
    private _sceneScoped?: boolean

    private _storage: State extends never ? undefined : IStateStorage
    private _stateKeyDelegate: State extends never
        ? undefined
        : StateKeyDelegate

    private _customStateKeyDelegate?: StateKeyDelegate
    private _customStorage?: IStateStorage

    private _handlersCount: Record<string, number> = {}

    private _errorHandler?: <
        T extends Exclude<UpdateHandler, RawUpdateHandler>
    >(
        err: Error,
        update: UpdateInfoForError<T>,
        state?: UpdateState<State, SceneName>
    ) => MaybeAsync<void>

    /**
     * Create a new dispatcher, that will be used as a child,
     * optionally providing a custom key delegate
     */
    constructor(key?: StateKeyDelegate)
    /**
     * Create a new dispatcher, that will be used as a child, optionally
     * providing custom storage and key delegate
     */
    constructor(storage: IStateStorage, key?: StateKeyDelegate)
    /**
     * Create a new dispatcher and bind it to client and optionally
     * FSM storage
     */
    constructor(
        client: TelegramClient,
        ...args: State extends never ? [] : [IStateStorage, StateKeyDelegate?]
    )
    constructor(
        client?: TelegramClient | IStateStorage | StateKeyDelegate,
        storage?: IStateStorage | StateKeyDelegate,
        key?: StateKeyDelegate
    ) {
        if (client) {
            if (client instanceof TelegramClient) {
                this.bindToClient(client)
                if (storage) {
                    this._storage = storage as any
                    this._stateKeyDelegate = (key ??
                        defaultStateKeyDelegate) as any
                }
            } else if (typeof client === 'function') {
                // is StateKeyDelegate
                this._customStateKeyDelegate = client as any
            } else {
                this._customStorage = client as any

                if (storage) {
                    this._customStateKeyDelegate = client as any
                }
            }
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
        update: tl.TypeUpdate | tl.TypeMessage | null,
        users: UsersIndex | null,
        chats: ChatsIndex | null,
        // this is getting a bit crazy lol
        parsed?: any,
        parsedType?: Exclude<UpdateHandler['type'], 'raw'> | null,
        parsedState?: UpdateState<State, SceneName> | null,
        parsedScene?: string | null,
        forceScene?: true
    ): Promise<void> {
        if (!this._client) return

        const isRawMessage = update && tl.isAnyMessage(update)

        if (parsed === undefined && this._handlersCount[update!._]) {
            const pair = PARSERS[update!._]
            if (pair) {
                parsed = pair[1](this._client, update!, users!, chats!)
                parsedType = pair[0]
            } else {
                parsed = parsedType = null
            }
        }

        if (parsedScene === undefined) {
            if (
                this._storage &&
                this._scenes &&
                (parsedType === 'new_message' ||
                    parsedType === 'edit_message' ||
                    parsedType === 'callback_query')
            ) {
                // no need to fetch scene if there are no registered scenes
                const key = await this._stateKeyDelegate!(parsed)
                if (key) {
                    parsedScene = await this._storage.getCurrentScene(key)
                } else {
                    parsedScene = null
                }
            } else {
                parsedScene = null
            }
        }

        if (!forceScene && parsedScene !== null) {
            if (this._scene) {
                if (this._scene !== parsedScene)
                    // should not happen, but just in case
                    return
            } else {
                if (!this._scenes || !(parsedScene in this._scenes))
                    // not registered scene
                    return

                return this._scenes[parsedScene]._dispatchUpdateNowImpl(
                    update,
                    users,
                    chats,
                    parsed,
                    parsedType,
                    parsedState,
                    parsedScene,
                    true
                )
            }
        }

        if (parsedState === undefined) {
            if (
                this._storage &&
                (parsedType === 'new_message' ||
                    parsedType === 'edit_message' ||
                    parsedType === 'callback_query')
            ) {
                const key = await this._stateKeyDelegate!(parsed)
                if (key) {
                    let customKey
                    if (
                        !this._customStateKeyDelegate ||
                        (customKey = await this._customStateKeyDelegate(parsed))
                    ) {
                        parsedState = new UpdateState(
                            this._storage!,
                            key,
                            this._scene ?? null,
                            this._sceneScoped,
                            this._customStorage,
                            customKey
                        )
                    }
                } else {
                    parsedState = null
                }
            } else {
                parsedState = null
            }
        }

        outer: for (const grp of this._groupsOrder) {
            const group = this._groups[grp]

            if (update && !isRawMessage && 'raw' in group) {
                const handlers = group['raw'] as RawUpdateHandler[]

                for (const h of handlers) {
                    let result: void | PropagationAction

                    if (
                        !h.check ||
                        (await h.check(
                            this._client,
                            update as any,
                            users!,
                            chats!
                        ))
                    ) {
                        result = await h.callback(
                            this._client,
                            update as any,
                            users!,
                            chats!
                        )
                    } else continue

                    switch (result) {
                        case 'continue':
                            continue
                        case 'stop':
                            break outer
                        case 'stop-children':
                            return
                    }

                    break
                }
            }

            if (parsedType && parsedType in group) {
                // raw is not handled here, so we can safely assume this
                const handlers = group[parsedType] as Exclude<
                    UpdateHandler,
                    RawUpdateHandler
                >[]

                try {
                    for (const h of handlers) {
                        let result: void | PropagationAction

                        if (
                            !h.check ||
                            (await h.check(parsed, parsedState as never))
                        ) {
                            result = await h.callback(
                                parsed,
                                parsedState as never
                            )
                        } else continue

                        switch (result) {
                            case 'continue':
                                continue
                            case 'stop':
                                break outer
                            case 'stop-children':
                                return
                            case 'scene': {
                                if (!parsedState)
                                    throw new MtCuteArgumentError(
                                        'Cannot use ToScene without state'
                                    )

                                const scene = parsedState['_scene']

                                if (!scene)
                                    throw new MtCuteArgumentError(
                                        'Cannot use ToScene without entering a scene'
                                    )

                                return this._scenes[
                                    scene
                                ]._dispatchUpdateNowImpl(
                                    update,
                                    users,
                                    chats,
                                    parsed,
                                    parsedType,
                                    undefined,
                                    scene,
                                    true
                                )
                            }
                        }

                        break
                    }
                } catch (e) {
                    if (this._errorHandler) {
                        await this._errorHandler(
                            e,
                            { type: parsedType, data: parsed },
                            parsedState as never
                        )
                    } else {
                        throw e
                    }
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
                    this._handlersCount[upd] -= this._groups[group][
                        handler
                    ].length
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

    /**
     * Register an error handler.
     *
     * This is used locally within this dispatcher
     * (does not affect children/parent) whenever
     * an error is thrown inside an update handler.
     * Not used for raw update handlers
     *
     * When an error is thrown, but there is no error
     * handler, it is propagated to `TelegramClient`.
     *
     * There can be at most one error handler.
     * Pass `null` to remove it.
     *
     * @param handler  Error handler
     */
    onError(
        handler:
            | ((
                  err: Error,
                  update: UpdateInfoForError<UpdateHandler>,
                  state?: UpdateState<State, SceneName>
              ) => MaybeAsync<void>)
            | null
    ): void {
        if (handler) this._errorHandler = handler
        else this._errorHandler = undefined
    }

    /**
     * Set error handler that will propagate
     * the error to the parent dispatcher
     */
    propagateErrorToParent<T extends Exclude<UpdateHandler, RawUpdateHandler>>(
        err: Error,
        update: UpdateInfoForError<T>,
        state?: UpdateState<State, SceneName>
    ): MaybeAsync<void> {
        if (!this.parent)
            throw new MtCuteArgumentError('This dispatcher is not a child')

        if (this.parent._errorHandler) {
            return this.parent._errorHandler(err, update, state)
        } else {
            throw err
        }
    }

    // children //

    /**
     * Get parent dispatcher if current dispatcher is a child.
     * Otherwise, return `null`
     */
    get parent(): Dispatcher<any> | null {
        return this._parent ?? null
    }

    private _prepareChild(child: Dispatcher<any>): void {
        if (child._client) {
            throw new MtCuteArgumentError(
                'Provided dispatcher is ' +
                    (child._parent
                        ? 'already a child. Use parent.removeChild() before calling addChild()'
                        : 'already bound to a client. Use unbind() before calling addChild()')
            )
        }

        child._parent = this as any
        child._client = this._client
        child._storage = this._storage
        child._stateKeyDelegate = this._stateKeyDelegate
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
     * Note that child dispatchers share the same TelegramClient and
     * storage binding as the parent, don't bind them manually.
     *
     * @param child  Other dispatcher
     */
    addChild(child: Dispatcher<State, SceneName>): void {
        if (this._children.indexOf(child) > -1) return

        this._prepareChild(child)
        this._children.push(child)
    }

    /**
     * Add a dispatcher as a scene with a non-scoped state.
     *
     * Scoped storage for a scene means that the scene will
     * have its own storage, that is only available within
     * the scene and does not interfere with global state.
     * Non-scoped, on the other hand, is the same state as
     * the one used for the root dispatcher
     *
     * @param uid  UID of the scene
     * @param scene  Dispatcher representing the scene
     * @param scoped  Whether to use scoped FSM storage for the scene
     */
    addScene(
        uid: SceneName,
        scene: Dispatcher<State, SceneName>,
        scoped: false
    ): void
    /**
     * Add a dispatcher as a scene with a scoped state
     *
     * Scoped storage for a scene means that the scene will
     * have its own storage, that is only available within
     * the scene and does not interfere with global state.
     * Non-scoped, on the other hand, is the same state as
     * the one used for the root dispatcher
     *
     * @param uid  UID of the scene
     * @param scene  Dispatcher representing the scene
     * @param scoped  Whether to use scoped FSM storage for the scene (defaults to `true`)
     */
    addScene(
        uid: SceneName,
        scene: Dispatcher<any, SceneName>,
        scoped?: true
    ): void
    addScene(
        uid: SceneName,
        scene: Dispatcher<any, SceneName>,
        scoped = true
    ): void {
        if (!this._scenes) this._scenes = {}
        if (uid in this._scenes) {
            throw new MtCuteArgumentError(
                `Scene with UID ${uid} is already registered!`
            )
        }

        if (uid[0] === '$') {
            throw new MtCuteArgumentError(`Scene UID cannot start with $`)
        }

        if (scene._scene) {
            throw new MtCuteArgumentError(
                `This dispatcher is already registered as scene ${scene._scene}`
            )
        }

        this._prepareChild(scene)
        scene._scene = uid
        scene._sceneScoped = scoped
        this._scenes[uid] = scene
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
     * @param child  Other dispatcher
     */
    removeChild(child: Dispatcher): void {
        const idx = this._children.indexOf(child)
        if (idx > -1) {
            child._unparent()
            this._children.splice(idx, 1)
        }
    }

    private _unparent(): void {
        this._parent = this._client = undefined
        ;(this as any)._stateKeyDelegate = undefined
        ;(this as any)._storage = undefined
    }

    /**
     * Extend current dispatcher by copying other dispatcher's
     * handlers and children to the current.
     *
     * This might be more efficient for simple cases, but do note that the handler
     * groups, children and scenes will get merged (unlike {@link addChild},
     * where they are independent). Also note that unlike with children,
     * when adding handlers to `other` *after* you extended
     * the current dispatcher, changes will not be applied.
     *
     * @param other  Other dispatcher
     */
    extend(other: Dispatcher<State, SceneName>): void {
        if (other._customStorage || other._customStateKeyDelegate) {
            throw new MtCuteArgumentError(
                'Provided dispatcher has custom storage and cannot be extended from.'
            )
        }

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

        Object.keys(other._handlersCount).forEach((typ) => {
            this._handlersCount[typ] += other._handlersCount[typ]
        })

        other._children.forEach((it) => {
            it._unparent()
            this.addChild(it as any)
        })

        if (other._scenes) {
            Object.keys(other._scenes).forEach((key) => {
                other._scenes[key]._unparent()
                if (key in this._scenes) {
                    // will be overwritten
                    delete this._scenes[key]
                }

                this.addScene(
                    key as any,
                    other._scenes[key] as any,
                    other._scenes[key]._sceneScoped as any
                )
            })
        }

        this._groupsOrder.sort((a, b) => a - b)
    }

    /**
     * Create a clone of this dispatcher, that has the same handlers,
     * but is not bound to a client or to a parent dispatcher.
     *
     * Custom Storage and key delegate are copied too.
     *
     * By default, child dispatchers (and scenes) are ignored, since
     * that requires cloning every single one of them recursively
     * and then binding them back.
     *
     * @param children  Whether to also clone children and scenes
     */
    clone(children = false): Dispatcher<State, SceneName> {
        const dp = new Dispatcher<State, SceneName>()

        // copy handlers.
        Object.keys(this._groups).forEach((key) => {
            const idx = (key as any) as number

            dp._groups[idx] = {} as any

            Object.keys(this._groups[idx]).forEach(
                (type: UpdateHandler['type']) => {
                    dp._groups[idx][type] = [...this._groups[idx][type]]
                }
            )
        })

        dp._groupsOrder = [...this._groupsOrder]
        dp._handlersCount = { ...this._handlersCount }
        dp._errorHandler = this._errorHandler
        dp._customStateKeyDelegate = this._customStateKeyDelegate
        dp._customStorage = this._customStorage

        if (children) {
            this._children.forEach((it) => {
                const child = it.clone(true)
                dp.addChild(child as any)
            })

            if (this._scenes) {
                Object.keys(this._scenes).forEach((key) => {
                    const scene = this._scenes[key].clone(true)
                    dp.addScene(
                        key as any,
                        scene as any,
                        this._scenes[key]._sceneScoped as any
                    )
                })
            }
        }

        return dp
    }

    /**
     * Get update state object for the given key.
     *
     * For custom keys, use prefix starting with `$` to avoid
     * clashing with other keys (scene name can't start with `$`)
     *
     * @param key  State storage key
     * @template S  State type, defaults to dispatcher's state type. Only checked at compile-time
     */
    getState<S = State>(key: string): UpdateState<S, SceneName>

    /**
     * Get update state object for the given object.
     *
     * Equivalent to `getState(string)`, but derives
     * the key with the registered {@link StateKeyDelegate},
     * and since it could be async, this method is async too.
     *
     * @param object  Object for which the state should be fetched
     * @template S  State type, defaults to dispatcher's state type. Only checked at compile-time
     */
    getState<S = State>(
        object: Parameters<StateKeyDelegate>[0]
    ): Promise<UpdateState<S, SceneName>>
    getState<S = State>(
        object: string | Parameters<StateKeyDelegate>[0]
    ): MaybeAsync<UpdateState<S, SceneName>> {
        if (!this._storage)
            throw new MtCuteArgumentError(
                'Cannot use getUpdateState() filter without state storage'
            )

        if (typeof object === 'string') {
            return new UpdateState(
                this._storage!,
                object,
                this._scene ?? null,
                this._sceneScoped,
                this._customStorage
            )
        }

        return Promise.resolve(this._stateKeyDelegate!(object)).then((key) => {
            if (!key) {
                throw new MtCuteArgumentError(
                    'Cannot derive key from given object'
                )
            }

            if (!this._customStateKeyDelegate) {
                return new UpdateState(
                    this._storage!,
                    key,
                    this._scene ?? null,
                    this._sceneScoped,
                    this._customStorage
                )
            }

            return Promise.resolve(this._customStateKeyDelegate(object)).then(
                (customKey) => {
                    if (!customKey) {
                        throw new MtCuteArgumentError(
                            'Cannot derive custom key from given object'
                        )
                    }

                    return new UpdateState(
                        this._storage!,
                        key,
                        this._scene ?? null,
                        this._sceneScoped,
                        this._customStorage,
                        customKey
                    )
                }
            )
        })
    }

    /**
     * Get global state.
     *
     * This will load the state for the given object
     * ignoring local custom storage, key delegate and scene scope.
     */
    getGlobalState<T>(
        object: Parameters<StateKeyDelegate>[0]
    ): Promise<UpdateState<T, SceneName>> {
        if (!this._parent) {
            throw new MtCuteArgumentError(
                'This dispatcher does not have a parent'
            )
        }

        return Promise.resolve(this._stateKeyDelegate!(object)).then((key) => {
            if (!key) {
                throw new MtCuteArgumentError(
                    'Cannot derive key from given object'
                )
            }

            return new UpdateState(
                this._storage!,
                key,
                this._scene ?? null,
                false
            )
        })
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
     */
    onNewMessage(
        handler: NewMessageHandler<
            Message,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
        group?: number
    ): void

    /**
     * Register a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
     * @param group  Handler group index
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<Message, Mod, State>,
        handler: NewMessageHandler<
            filters.Modify<Message, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
        group?: number
    ): void

    /**
     * Register a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
     * @param group  Handler group index
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: NewMessageHandler<
            filters.Modify<Message, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
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
     */
    onEditMessage(
        handler: EditMessageHandler<
            Message,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
        group?: number
    ): void

    /**
     * Register an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage<Mod>(
        filter: UpdateFilter<Message, Mod, State>,
        handler: EditMessageHandler<
            filters.Modify<Message, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
        group?: number
    ): void

    /**
     * Register an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: EditMessageHandler<
            filters.Modify<Message, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
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
     */
    onCallbackQuery(
        handler: CallbackQueryHandler<
            CallbackQuery,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
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
        filter: UpdateFilter<CallbackQuery, Mod, State>,
        handler: CallbackQueryHandler<
            filters.Modify<CallbackQuery, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
        >['callback'],
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
            filters.Modify<CallbackQuery, Mod>,
            State extends never ? never : UpdateState<State, SceneName>
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
