/* eslint-disable @typescript-eslint/unified-signatures,@typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,max-depth,dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */
// ^^ will be looked into in MTQ-29

import {
    BotReactionCountUpdate,
    BotReactionUpdate,
    BotStoppedUpdate,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    HistoryReadUpdate,
    MaybeAsync,
    MtArgumentError,
    ParsedUpdate,
    PeersIndex,
    PollUpdate,
    PollVoteUpdate,
    StoryUpdate,
    TelegramClient,
    tl,
    UserStatusUpdate,
    UserTypingUpdate,
} from '@mtcute/client'

import { UpdateContext } from './context/base.js'
import {
    CallbackQueryContext,
    ChatJoinRequestUpdateContext,
    ChosenInlineResultContext,
    InlineCallbackQueryContext,
    InlineQueryContext,
    MessageContext,
    PreCheckoutQueryContext,
} from './context/index.js'
import { _parsedUpdateToContext, UpdateContextType } from './context/parse.js'
import { filters, UpdateFilter } from './filters/index.js'
// begin-codegen-imports
import {
    BotChatJoinRequestHandler,
    BotReactionCountUpdateHandler,
    BotReactionUpdateHandler,
    BotStoppedHandler,
    CallbackQueryHandler,
    ChatJoinRequestHandler,
    ChatMemberUpdateHandler,
    ChosenInlineResultHandler,
    DeleteMessageHandler,
    DeleteStoryHandler,
    EditMessageHandler,
    HistoryReadHandler,
    InlineCallbackQueryHandler,
    InlineQueryHandler,
    MessageGroupHandler,
    NewMessageHandler,
    PollUpdateHandler,
    PollVoteHandler,
    PreCheckoutQueryHandler,
    RawUpdateHandler,
    StoryUpdateHandler,
    UpdateHandler,
    UserStatusUpdateHandler,
    UserTypingHandler,
} from './handler.js'
// end-codegen-imports
import { PropagationAction } from './propagation.js'
import {
    defaultStateKeyDelegate,
    isCompatibleStorage,
    IStateStorage,
    StateKeyDelegate,
    UpdateState,
} from './state/index.js'

export interface DispatcherParams {
    /**
     * If this dispatcher can be used as a scene, its unique name.
     *
     * Should not be set manually, use {@link Dispatcher.scene} instead
     */
    sceneName?: string

    /**
     * Custom storage for this dispatcher and its children.
     *
     * @default  Client's storage
     */
    storage?: IStateStorage

    /**
     * Custom key delegate for the dispatcher.
     */
    key?: StateKeyDelegate
}

/**
 * Updates dispatcher
 */
export class Dispatcher<State extends object = never> {
    private _groups: Map<number, Map<UpdateHandler['name'], UpdateHandler[]>> = new Map()
    private _groupsOrder: number[] = []

    private _client?: TelegramClient

    private _parent?: Dispatcher<any>
    private _children: Dispatcher<any>[] = []

    private _scenes?: Map<string, Dispatcher<any>>
    private _scene?: string
    private _sceneScoped?: boolean

    private _storage?: State extends never ? undefined : IStateStorage
    private _stateKeyDelegate?: State extends never ? undefined : StateKeyDelegate

    private _customStateKeyDelegate?: StateKeyDelegate
    private _customStorage?: IStateStorage

    private _errorHandler?: <T = {}>(
        err: Error,
        update: ParsedUpdate & T,
        state?: UpdateState<State>,
    ) => MaybeAsync<boolean>

    private _preUpdateHandler?: <T = {}>(
        update: ParsedUpdate & T,
        state?: UpdateState<State>,
    ) => MaybeAsync<PropagationAction | void>

    private _postUpdateHandler?: <T = {}>(
        handled: boolean,
        update: ParsedUpdate & T,
        state?: UpdateState<State>,
    ) => MaybeAsync<void>

    protected constructor(client?: TelegramClient, params?: DispatcherParams) {
        this.dispatchRawUpdate = this.dispatchRawUpdate.bind(this)
        this.dispatchUpdate = this.dispatchUpdate.bind(this)
        this._onClientBeforeConnect = this._onClientBeforeConnect.bind(this)
        this._onClientBeforeClose = this._onClientBeforeClose.bind(this)

        // eslint-disable-next-line prefer-const
        let { storage, key, sceneName } = params ?? {}

        if (client) {
            this.bindToClient(client)

            if (!storage) {
                const _storage = client.storage

                // if (!isCompatibleStorage(_storage)) {
                //     // todo: dont throw if state is never used
                //     throw new MtArgumentError(
                //         'Storage used by the client is not compatible with the dispatcher. Please provide a compatible storage manually',
                //     )
                // }

                storage = _storage as any
            }

            if (storage) {
                this._storage = storage as any
                this._stateKeyDelegate = (key ?? defaultStateKeyDelegate) as any
            }
        } else {
            // child dispatcher without client

            if (storage) {
                this._customStorage = storage as any
            }

            if (key) {
                this._customStateKeyDelegate = key as any
            }

            if (sceneName) {
                if (sceneName[0] === '$') {
                    throw new MtArgumentError('Scene name cannot start with $')
                }

                this._scene = sceneName
            }
        }
    }

    /**
     * Create a new dispatcher and bind it to the client.
     */
    static for<State extends object = never>(client: TelegramClient, params?: DispatcherParams): Dispatcher<State> {
        return new Dispatcher<State>(client, params)
    }

    /**
     * Create a new child dispatcher.
     */
    static child<State extends object = never>(params?: DispatcherParams): Dispatcher<State> {
        return new Dispatcher<State>(undefined, params)
    }

    /**
     * Create a new scene dispatcher
     */
    static scene<State extends object = Record<never, never>>(
        name: string,
        params?: Omit<DispatcherParams, 'sceneName'>,
    ): Dispatcher<State> {
        return new Dispatcher<State>(undefined, { sceneName: name, ...params })
    }

    /** For scene dispatchers, name of the scene */
    get sceneName(): string | undefined {
        return this._scene
    }

    private _onClientBeforeConnect() {
        (async () => {
            if (
                !this._parent &&
                this._storage &&
                this._storage !== (this._client!.storage as unknown as IStateStorage)
            ) {
                // this is a root dispatcher with custom storage
                await this._storage.load?.()
            }

            if (this._parent && this._customStorage) {
                // this is a child dispatcher with custom storage
                await this._customStorage.load?.()
            }

            for (const child of this._children) {
                child._onClientBeforeConnect()
            }

            if (this._scenes) {
                for (const scene of this._scenes.values()) {
                    scene._onClientBeforeConnect()
                }
            }
        })().catch((err) => this._client!._emitError(err))
    }

    private _onClientBeforeClose() {
        (async () => {
            if (
                !this._parent &&
                this._storage &&
                this._storage !== (this._client!.storage as unknown as IStateStorage)
            ) {
                // this is a root dispatcher with custom storage
                await this._storage.save?.()
                await this._storage.destroy?.()
            }

            if (this._parent && this._customStorage) {
                // this is a child dispatcher with custom storage
                await this._customStorage.save?.()
                await this._customStorage.destroy?.()
            }

            for (const child of this._children) {
                child._onClientBeforeClose()
            }

            if (this._scenes) {
                for (const scene of this._scenes.values()) {
                    scene._onClientBeforeClose()
                }
            }
        })().catch((err) => this._client!._emitError(err))
    }

    /**
     * Bind the dispatcher to the client.
     * Called by the constructor automatically if
     * `client` was passed.
     *
     * Dispatcher also uses bound client to throw errors
     */
    bindToClient(client: TelegramClient): void {
        client.on('update', this.dispatchUpdate)
        client.on('raw_update', this.dispatchRawUpdate)
        client.on('before_connect', this._onClientBeforeConnect)
        client.on('before_close', this._onClientBeforeClose)

        this._client = client
    }

    /**
     * Unbind a dispatcher from the client.
     */
    unbind(): void {
        if (this._client) {
            this._client.off('update', this.dispatchUpdate)
            this._client.off('raw_update', this.dispatchRawUpdate)
            this._client.off('before_connect', this._onClientBeforeConnect)
            this._client.off('before_close', this._onClientBeforeClose)

            this._client = undefined
        }
    }

    /**
     * Process a raw update with this dispatcher.
     * Calling this method without bound client will not work.
     *
     * Under the hood asynchronously calls {@link dispatchRawUpdateNow}
     * with error handler set to client's one.
     *
     * @param update  Update to process
     * @param peers Peers index
     */
    dispatchRawUpdate(update: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex): void {
        if (!this._client) return

        // order does not matter in the dispatcher,
        // so we can handle each update in its own task
        this.dispatchRawUpdateNow(update, peers).catch((err) => this._client!._emitError(err))
    }

    /**
     * Process a raw update right now in the current stack.
     *
     * Unlike {@link dispatchRawUpdate}, this does not schedule
     * the update to be dispatched, but dispatches it immediately,
     * and after `await`ing this method you can be certain that the update
     * was fully processed by all the registered handlers, including children.
     *
     * @param update  Update to process
     * @param peers  Peers map
     * @returns  Whether the update was handled
     */
    async dispatchRawUpdateNow(update: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex): Promise<boolean> {
        if (!this._client) return false

        let handled = false

        outer: for (const grp of this._groupsOrder) {
            const group = this._groups.get(grp)!

            if (group.has('raw')) {
                const handlers = group.get('raw')! as RawUpdateHandler[]

                for (const h of handlers) {
                    let result: void | PropagationAction

                    if (!h.check || (await h.check(this._client, update, peers))) {
                        result = await h.callback(this._client, update, peers)
                        handled = true
                    } else continue

                    switch (result) {
                        case 'continue':
                            continue
                        case 'stop':
                            break outer
                        case 'stop-children':
                            return handled
                    }

                    break
                }
            }
        }

        for (const child of this._children) {
            const childHandled = await child.dispatchRawUpdateNow(update, peers)
            handled ||= childHandled
        }

        return handled
    }

    /**
     * Process an update with this dispatcher.
     * Calling this method without bound client will not work.
     *
     * Under the hood asynchronously calls {@link dispatchUpdateNow}
     * with error handler set to client's one.
     *
     * @param update  Update to process
     */
    dispatchUpdate(update: ParsedUpdate): void {
        if (!this._client) return

        // order does not matter in the dispatcher,
        // so we can handle each update in its own task
        this.dispatchUpdateNow(update).catch((err) => this._client!._emitError(err))
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
     * @returns  Whether the update was handled
     */
    async dispatchUpdateNow(update: ParsedUpdate): Promise<boolean> {
        return this._dispatchUpdateNowImpl(update)
    }

    private async _dispatchUpdateNowImpl(
        update: ParsedUpdate,
        // this is getting a bit crazy lol
        parsedState?: UpdateState<State> | null,
        parsedScene?: string | null,
        forceScene?: true,
        parsedContext?: UpdateContextType,
    ): Promise<boolean> {
        if (!this._client) return false

        if (parsedScene === undefined) {
            if (
                this._storage &&
                this._scenes &&
                (update.name === 'new_message' ||
                    update.name === 'edit_message' ||
                    update.name === 'callback_query' ||
                    update.name === 'message_group')
            ) {
                // no need to fetch scene if there are no registered scenes

                if (!parsedContext) parsedContext = _parsedUpdateToContext(this._client, update)
                const key = await this._stateKeyDelegate!(parsedContext as any)

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
                if (this._scene !== parsedScene) {
                    // should not happen, but just in case
                    return false
                }
            } else {
                if (!this._scenes || !this._scenes.has(parsedScene)) {
                    // not registered scene
                    return false
                }

                return this._scenes.get(parsedScene)!._dispatchUpdateNowImpl(update, parsedState, parsedScene, true)
            }
        }

        if (parsedState === undefined) {
            if (
                this._storage &&
                (update.name === 'new_message' ||
                    update.name === 'edit_message' ||
                    update.name === 'callback_query' ||
                    update.name === 'message_group')
            ) {
                if (!parsedContext) parsedContext = _parsedUpdateToContext(this._client, update)
                const key = await this._stateKeyDelegate!(parsedContext as any)

                if (key) {
                    let customKey

                    if (
                        !this._customStateKeyDelegate ||
                        (customKey = await this._customStateKeyDelegate(parsedContext as any))
                    ) {
                        parsedState = new UpdateState(
                            this._storage,
                            key,
                            this._scene ?? null,
                            this._sceneScoped,
                            this._customStorage,
                            customKey,
                        )
                    }
                } else {
                    parsedState = null
                }
            } else {
                parsedState = null
            }
        }

        let shouldDispatch = true
        let shouldDispatchChildren = true
        let handled = false

        switch (await this._preUpdateHandler?.(update, parsedState as any)) {
            case 'stop':
                shouldDispatch = false
                break
            case 'stop-children':
                return false
        }

        if (shouldDispatch) {
            outer: for (const grp of this._groupsOrder) {
                const group = this._groups.get(grp)!

                if (group.has(update.name)) {
                    // raw is not handled here, so we can safely assume this
                    const handlers = group.get(update.name)! as Exclude<UpdateHandler, RawUpdateHandler>[]

                    try {
                        for (const h of handlers) {
                            let result: void | PropagationAction

                            if (!parsedContext) parsedContext = _parsedUpdateToContext(this._client, update)
                            if (!h.check || (await h.check(parsedContext as any, parsedState as never))) {
                                result = await h.callback(parsedContext as any, parsedState as never)
                                handled = true
                            } else continue

                            switch (result) {
                                case 'continue':
                                    continue
                                case 'stop':
                                    break outer
                                case 'stop-children':
                                    shouldDispatchChildren = false
                                    break outer

                                case 'scene': {
                                    if (!parsedState) {
                                        throw new MtArgumentError('Cannot use ToScene without state')
                                    }

                                    const scene = parsedState['_scene']

                                    if (!scene) {
                                        throw new MtArgumentError('Cannot use ToScene without entering a scene')
                                    }

                                    return this._scenes!.get(scene)!._dispatchUpdateNowImpl(
                                        update,
                                        undefined,
                                        scene,
                                        true,
                                    )
                                }
                            }

                            break
                        }
                    } catch (e: any) {
                        if (this._errorHandler) {
                            const handled = await this._errorHandler(e, update, parsedState as never)
                            if (!handled) throw e
                        } else {
                            throw e
                        }
                    }
                }
            }
        }

        if (shouldDispatchChildren) {
            for (const child of this._children) {
                const childHandled = await child._dispatchUpdateNowImpl(update)
                handled ||= childHandled
            }
        }

        await this._postUpdateHandler?.(handled, update, parsedState as any)

        return handled
    }

    /**
     * Add an update handler to a given handlers group
     *
     * @param handler  Update handler
     * @param group  Handler group index
     */
    addUpdateHandler(handler: UpdateHandler, group = 0): void {
        if (!this._groups.has(group)) {
            this._groups.set(group, new Map())
            this._groupsOrder.push(group)
            this._groupsOrder.sort((a, b) => a - b)
        }

        if (!this._groups.get(group)!.has(handler.name)) {
            this._groups.get(group)!.set(handler.name, [])
        }

        this._groups.get(group)!.get(handler.name)!.push(handler)
    }

    /**
     * Remove an update handler (or handlers) from a given
     * handler group.
     *
     * @param handler  Update handler to remove, its name or `'all'` to remove all
     * @param group  Handler group index (null to affect all groups)
     */
    removeUpdateHandler(handler: UpdateHandler | UpdateHandler['name'] | 'all', group: number | null = 0): void {
        if (group !== null && !this._groups.has(group)) {
            return
        }

        if (typeof handler === 'string') {
            if (handler === 'all') {
                if (group === null) {
                    this._groups = new Map()
                } else {
                    this._groups.delete(group)
                }
            } else if (group !== null) {
                this._groups.get(group)!.delete(handler)
            }

            return
        }

        if (group === null) return

        if (!this._groups.get(group)!.has(handler.name)) {
            return
        }

        const idx = this._groups.get(group)!.get(handler.name)!.indexOf(handler)

        if (idx > -1) {
            this._groups.get(group)!.get(handler.name)!.splice(idx, 1)
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
    onError<T = {}>(
        handler: ((err: Error, update: ParsedUpdate & T, state?: UpdateState<State>) => MaybeAsync<boolean>) | null,
    ): void {
        if (handler) this._errorHandler = handler
        else this._errorHandler = undefined
    }

    /**
     * Register pre-update middleware.
     *
     * This is used locally within this dispatcher
     * (does not affect children/parent) before processing
     * an update, and can be used to skip this update.
     *
     * There can be at most one pre-update middleware.
     * Pass `null` to remove it.
     *
     * @param handler  Pre-update middleware
     */
    onPreUpdate<T = {}>(
        handler:
            | ((update: ParsedUpdate & T, state?: UpdateState<State>) => MaybeAsync<PropagationAction | void>)
            | null,
    ): void {
        if (handler) this._preUpdateHandler = handler
        else this._preUpdateHandler = undefined
    }

    /**
     * Register post-update middleware.
     *
     * This is used locally within this dispatcher
     * (does not affect children/parent) after successfully
     * processing an update, and can be used for stats.
     *
     * There can be at most one post-update middleware.
     * Pass `null` to remove it.
     *
     * @param handler  Pre-update middleware
     */
    onPostUpdate<T = {}>(
        handler: ((handled: boolean, update: ParsedUpdate & T, state?: UpdateState<State>) => MaybeAsync<void>) | null,
    ): void {
        if (handler) this._postUpdateHandler = handler
        else this._postUpdateHandler = undefined
    }

    /**
     * Set error handler that will propagate
     * the error to the parent dispatcher
     */
    propagateErrorToParent(err: Error, update: ParsedUpdate, state?: UpdateState<State>): MaybeAsync<boolean> {
        if (!this.parent) {
            throw new MtArgumentError('This dispatcher is not a child')
        }

        if (this.parent._errorHandler) {
            return this.parent._errorHandler(err, update, state as any)
        }
        throw err
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
            throw new MtArgumentError(
                'Provided dispatcher is ' +
                    (child._parent ?
                        'already a child. Use parent.removeChild() before calling addChild()' :
                        'already bound to a client. Use unbind() before calling addChild()'),
            )
        }

        child._parent = this as any
        child._client = this._client
        child._storage = this._storage
        child._stateKeyDelegate = this._stateKeyDelegate
        child._customStorage ??= this._customStorage
        child._customStateKeyDelegate ??= this._customStateKeyDelegate
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
    addChild(child: Dispatcher<State>): void {
        if (this._children.includes(child)) return

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
    addScene(scene: Dispatcher<State>, scoped: false): void
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
    addScene(scene: Dispatcher<any>, scoped?: true): void
    addScene(scene: Dispatcher<any>, scoped = true): void {
        if (!this._scenes) this._scenes = new Map()

        if (!scene._scene) {
            throw new MtArgumentError(
                'Non-scene dispatcher passed to addScene. Use `Dispatcher.scene()` to create one.',
            )
        }

        if (this._scenes.has(scene._scene)) {
            throw new MtArgumentError(`Scene with name ${scene._scene} is already registered!`)
        }

        this._prepareChild(scene)
        scene._sceneScoped = scoped
        this._scenes.set(scene._scene, scene)
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
    removeChild(child: Dispatcher<any>): void {
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
    extend(other: Dispatcher<State>): void {
        if (other._customStorage || other._customStateKeyDelegate) {
            throw new MtArgumentError('Provided dispatcher has custom storage and cannot be extended from.')
        }

        other._groupsOrder.forEach((group) => {
            if (!this._groups.has(group)) {
                this._groups.set(group, other._groups.get(group)!)
                this._groupsOrder.push(group)
            } else {
                const otherGrp = other._groups.get(group)!
                const selfGrp = this._groups.get(group)!

                for (const typ of otherGrp.keys()) {
                    if (!selfGrp.has(typ)) {
                        selfGrp.set(typ, otherGrp.get(typ)!)
                    } else {
                        // selfGrp[typ].push(...otherGrp[typ])
                        selfGrp.get(typ)!.push(...otherGrp.get(typ)!)
                    }
                }
            }
        })

        other._children.forEach((it) => {
            it._unparent()
            this.addChild(it as any)
        })

        if (other._scenes) {
            const otherScenes = other._scenes
            if (!this._scenes) this._scenes = new Map()
            const myScenes = this._scenes

            for (const key of otherScenes.keys()) {
                otherScenes.get(key)!._unparent()

                if (myScenes.has(key)) {
                    // will be overwritten
                    myScenes.delete(key)
                }

                this.addScene(otherScenes.get(key) as any, otherScenes.get(key)!._sceneScoped as any)
            }
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
    clone(children = false): Dispatcher<State> {
        const dp = new Dispatcher<State>()

        // copy handlers.
        for (const key of this._groups.keys()) {
            const idx = key as any as number

            dp._groups.set(idx, new Map())

            for (const type of this._groups.get(idx)!.keys()) {
                // dp._groups.get(idx)!.set(type, [...this._groups.get(idx)!].get(type)!])
                dp._groups.get(idx)!.set(type, [...this._groups.get(idx)!.get(type)!])
            }
        }

        dp._groupsOrder = [...this._groupsOrder]
        dp._errorHandler = this._errorHandler
        dp._customStateKeyDelegate = this._customStateKeyDelegate
        dp._customStorage = this._customStorage

        if (children) {
            this._children.forEach((it) => {
                const child = it.clone(true)
                dp.addChild(child as any)
            })

            if (this._scenes) {
                for (const key of this._scenes.keys()) {
                    const scene = this._scenes.get(key)!.clone(true)
                    dp.addScene(scene as any, this._scenes.get(key)!._sceneScoped as any)
                }
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
    getState<S extends object = State>(key: string): UpdateState<S>

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
    getState<S extends object = State>(object: Parameters<StateKeyDelegate>[0]): Promise<UpdateState<S>>
    getState<S extends object = State>(object: string | Parameters<StateKeyDelegate>[0]): MaybeAsync<UpdateState<S>> {
        if (!this._storage) {
            throw new MtArgumentError('Cannot use getUpdateState() filter without state storage')
        }

        if (typeof object === 'string') {
            return new UpdateState(this._storage, object, this._scene ?? null, this._sceneScoped, this._customStorage)
        }

        return Promise.resolve(this._stateKeyDelegate!(object)).then((key) => {
            if (!key) {
                throw new MtArgumentError('Cannot derive key from given object')
            }

            if (!this._customStateKeyDelegate) {
                return new UpdateState(this._storage!, key, this._scene ?? null, this._sceneScoped, this._customStorage)
            }

            return Promise.resolve(this._customStateKeyDelegate(object)).then((customKey) => {
                if (!customKey) {
                    throw new MtArgumentError('Cannot derive custom key from given object')
                }

                return new UpdateState(
                    this._storage!,
                    key,
                    this._scene ?? null,
                    this._sceneScoped,
                    this._customStorage,
                    customKey,
                )
            })
        })
    }

    /**
     * Get global state.
     *
     * This will load the state for the given object
     * ignoring local custom storage, key delegate and scene scope.
     */
    getGlobalState<T extends object>(object: Parameters<StateKeyDelegate>[0]): Promise<UpdateState<T>> {
        if (!this._parent) {
            throw new MtArgumentError('This dispatcher does not have a parent')
        }

        return Promise.resolve(this._stateKeyDelegate!(object)).then((key) => {
            if (!key) {
                throw new MtArgumentError('Cannot derive key from given object')
            }

            return new UpdateState(this._storage!, key, this._scene ?? null, false)
        })
    }

    // addUpdateHandler convenience wrappers //

    private _addKnownHandler(name: UpdateHandler['name'], filter: any, handler?: any, group?: number): void {
        if (typeof handler === 'number' || typeof handler === 'undefined') {
            this.addUpdateHandler(
                {
                    name,
                    callback: filter,
                },
                handler,
            )
        } else {
            this.addUpdateHandler(
                {
                    name,
                    callback: handler,
                    check: filter,
                },
                group,
            )
        }
    }

    /**
     * Register a raw update handler without any filters
     *
     * @param handler  Raw update handler
     * @param group  Handler group index
     */
    onRawUpdate(handler: RawUpdateHandler['callback'], group?: number): void

    /**
     * Register a raw update handler without any filters
     *
     * @param filter  Update filter
     * @param handler  Raw update handler
     * @param group  Handler group index
     */
    onRawUpdate(filter: RawUpdateHandler['check'], handler: RawUpdateHandler['callback'], group?: number): void

    /** @internal */
    onRawUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('raw', filter, handler, group)
    }

    // begin-codegen

    /**
     * Register a new message handler without any filters
     *
     * @param handler  New message handler
     * @param group  Handler group index
     */
    onNewMessage(
        handler: NewMessageHandler<MessageContext, State extends never ? never : UpdateState<State>>['callback'],
        group?: number,
    ): void

    /**
     * Register a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
     * @param group  Handler group index
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<MessageContext, Mod, State>,
        handler: NewMessageHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register a new message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  New message handler
     * @param group  Handler group index
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<MessageContext, Mod>,
        handler: NewMessageHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /** @internal */
    onNewMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('new_message', filter, handler, group)
    }

    /**
     * Register an edit message handler without any filters
     *
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage(
        handler: EditMessageHandler<MessageContext, State extends never ? never : UpdateState<State>>['callback'],
        group?: number,
    ): void

    /**
     * Register an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage<Mod>(
        filter: UpdateFilter<MessageContext, Mod, State>,
        handler: EditMessageHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register an edit message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Edit message handler
     * @param group  Handler group index
     */
    onEditMessage<Mod>(
        filter: UpdateFilter<MessageContext, Mod>,
        handler: EditMessageHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /** @internal */
    onEditMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('edit_message', filter, handler, group)
    }

    /**
     * Register a message group handler without any filters
     *
     * @param handler  Message group handler
     * @param group  Handler group index
     */
    onMessageGroup(
        handler: MessageGroupHandler<MessageContext, State extends never ? never : UpdateState<State>>['callback'],
        group?: number,
    ): void

    /**
     * Register a message group handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Message group handler
     * @param group  Handler group index
     */
    onMessageGroup<Mod>(
        filter: UpdateFilter<MessageContext, Mod, State>,
        handler: MessageGroupHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register a message group handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Message group handler
     * @param group  Handler group index
     */
    onMessageGroup<Mod>(
        filter: UpdateFilter<MessageContext, Mod>,
        handler: MessageGroupHandler<
            filters.Modify<MessageContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /** @internal */
    onMessageGroup(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('message_group', filter, handler, group)
    }

    /**
     * Register a delete message handler without any filters
     *
     * @param handler  Delete message handler
     * @param group  Handler group index
     */
    onDeleteMessage(handler: DeleteMessageHandler['callback'], group?: number): void

    /**
     * Register a delete message handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Delete message handler
     * @param group  Handler group index
     */
    onDeleteMessage<Mod>(
        filter: UpdateFilter<UpdateContext<DeleteMessageUpdate>, Mod>,
        handler: DeleteMessageHandler<filters.Modify<UpdateContext<DeleteMessageUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onDeleteMessage(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('delete_message', filter, handler, group)
    }

    /**
     * Register a chat member update handler without any filters
     *
     * @param handler  Chat member update handler
     * @param group  Handler group index
     */
    onChatMemberUpdate(handler: ChatMemberUpdateHandler['callback'], group?: number): void

    /**
     * Register a chat member update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chat member update handler
     * @param group  Handler group index
     */
    onChatMemberUpdate<Mod>(
        filter: UpdateFilter<UpdateContext<ChatMemberUpdate>, Mod>,
        handler: ChatMemberUpdateHandler<filters.Modify<UpdateContext<ChatMemberUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onChatMemberUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('chat_member', filter, handler, group)
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
        filter: UpdateFilter<InlineQueryContext, Mod>,
        handler: InlineQueryHandler<filters.Modify<InlineQueryContext, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onInlineQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('inline_query', filter, handler, group)
    }

    /**
     * Register a chosen inline result handler without any filters
     *
     * @param handler  Chosen inline result handler
     * @param group  Handler group index
     */
    onChosenInlineResult(handler: ChosenInlineResultHandler['callback'], group?: number): void

    /**
     * Register a chosen inline result handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chosen inline result handler
     * @param group  Handler group index
     */
    onChosenInlineResult<Mod>(
        filter: UpdateFilter<ChosenInlineResultContext, Mod>,
        handler: ChosenInlineResultHandler<filters.Modify<ChosenInlineResultContext, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onChosenInlineResult(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('chosen_inline_result', filter, handler, group)
    }

    /**
     * Register a callback query handler without any filters
     *
     * @param handler  Callback query handler
     * @param group  Handler group index
     */
    onCallbackQuery(
        handler: CallbackQueryHandler<
            CallbackQueryContext,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register a callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Callback query handler
     * @param group  Handler group index
     */
    onCallbackQuery<Mod>(
        filter: UpdateFilter<CallbackQueryContext, Mod, State>,
        handler: CallbackQueryHandler<
            filters.Modify<CallbackQueryContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register a callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Callback query handler
     * @param group  Handler group index
     */
    onCallbackQuery<Mod>(
        filter: UpdateFilter<CallbackQueryContext, Mod>,
        handler: CallbackQueryHandler<
            filters.Modify<CallbackQueryContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /** @internal */
    onCallbackQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('callback_query', filter, handler, group)
    }

    /**
     * Register an inline callback query handler without any filters
     *
     * @param handler  Inline callback query handler
     * @param group  Handler group index
     */
    onInlineCallbackQuery(
        handler: InlineCallbackQueryHandler<
            InlineCallbackQueryContext,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register an inline callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Inline callback query handler
     * @param group  Handler group index
     */
    onInlineCallbackQuery<Mod>(
        filter: UpdateFilter<InlineCallbackQueryContext, Mod, State>,
        handler: InlineCallbackQueryHandler<
            filters.Modify<InlineCallbackQueryContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /**
     * Register an inline callback query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Inline callback query handler
     * @param group  Handler group index
     */
    onInlineCallbackQuery<Mod>(
        filter: UpdateFilter<InlineCallbackQueryContext, Mod>,
        handler: InlineCallbackQueryHandler<
            filters.Modify<InlineCallbackQueryContext, Mod>,
            State extends never ? never : UpdateState<State>
        >['callback'],
        group?: number,
    ): void

    /** @internal */
    onInlineCallbackQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('inline_callback_query', filter, handler, group)
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
        filter: UpdateFilter<UpdateContext<PollUpdate>, Mod>,
        handler: PollUpdateHandler<filters.Modify<UpdateContext<PollUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onPollUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('poll', filter, handler, group)
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
        filter: UpdateFilter<UpdateContext<PollVoteUpdate>, Mod>,
        handler: PollVoteHandler<filters.Modify<UpdateContext<PollVoteUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onPollVote(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('poll_vote', filter, handler, group)
    }

    /**
     * Register an user status update handler without any filters
     *
     * @param handler  User status update handler
     * @param group  Handler group index
     */
    onUserStatusUpdate(handler: UserStatusUpdateHandler['callback'], group?: number): void

    /**
     * Register an user status update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  User status update handler
     * @param group  Handler group index
     */
    onUserStatusUpdate<Mod>(
        filter: UpdateFilter<UpdateContext<UserStatusUpdate>, Mod>,
        handler: UserStatusUpdateHandler<filters.Modify<UpdateContext<UserStatusUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onUserStatusUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('user_status', filter, handler, group)
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
        filter: UpdateFilter<UpdateContext<UserTypingUpdate>, Mod>,
        handler: UserTypingHandler<filters.Modify<UpdateContext<UserTypingUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onUserTyping(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('user_typing', filter, handler, group)
    }

    /**
     * Register a history read handler without any filters
     *
     * @param handler  History read handler
     * @param group  Handler group index
     */
    onHistoryRead(handler: HistoryReadHandler['callback'], group?: number): void

    /**
     * Register a history read handler with a filter
     *
     * @param filter  Update filter
     * @param handler  History read handler
     * @param group  Handler group index
     */
    onHistoryRead<Mod>(
        filter: UpdateFilter<UpdateContext<HistoryReadUpdate>, Mod>,
        handler: HistoryReadHandler<filters.Modify<UpdateContext<HistoryReadUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onHistoryRead(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('history_read', filter, handler, group)
    }

    /**
     * Register a bot stopped handler without any filters
     *
     * @param handler  Bot stopped handler
     * @param group  Handler group index
     */
    onBotStopped(handler: BotStoppedHandler['callback'], group?: number): void

    /**
     * Register a bot stopped handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Bot stopped handler
     * @param group  Handler group index
     */
    onBotStopped<Mod>(
        filter: UpdateFilter<UpdateContext<BotStoppedUpdate>, Mod>,
        handler: BotStoppedHandler<filters.Modify<UpdateContext<BotStoppedUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onBotStopped(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('bot_stopped', filter, handler, group)
    }

    /**
     * Register a bot chat join request handler without any filters
     *
     * @param handler  Bot chat join request handler
     * @param group  Handler group index
     */
    onBotChatJoinRequest(handler: BotChatJoinRequestHandler['callback'], group?: number): void

    /**
     * Register a bot chat join request handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Bot chat join request handler
     * @param group  Handler group index
     */
    onBotChatJoinRequest<Mod>(
        filter: UpdateFilter<ChatJoinRequestUpdateContext, Mod>,
        handler: BotChatJoinRequestHandler<filters.Modify<ChatJoinRequestUpdateContext, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onBotChatJoinRequest(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('bot_chat_join_request', filter, handler, group)
    }

    /**
     * Register a chat join request handler without any filters
     *
     * @param handler  Chat join request handler
     * @param group  Handler group index
     */
    onChatJoinRequest(handler: ChatJoinRequestHandler['callback'], group?: number): void

    /**
     * Register a chat join request handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Chat join request handler
     * @param group  Handler group index
     */
    onChatJoinRequest<Mod>(
        filter: UpdateFilter<UpdateContext<ChatJoinRequestUpdate>, Mod>,
        handler: ChatJoinRequestHandler<filters.Modify<UpdateContext<ChatJoinRequestUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onChatJoinRequest(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('chat_join_request', filter, handler, group)
    }

    /**
     * Register a pre checkout query handler without any filters
     *
     * @param handler  Pre checkout query handler
     * @param group  Handler group index
     */
    onPreCheckoutQuery(handler: PreCheckoutQueryHandler['callback'], group?: number): void

    /**
     * Register a pre checkout query handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Pre checkout query handler
     * @param group  Handler group index
     */
    onPreCheckoutQuery<Mod>(
        filter: UpdateFilter<PreCheckoutQueryContext, Mod>,
        handler: PreCheckoutQueryHandler<filters.Modify<PreCheckoutQueryContext, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onPreCheckoutQuery(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('pre_checkout_query', filter, handler, group)
    }

    /**
     * Register a story update handler without any filters
     *
     * @param handler  Story update handler
     * @param group  Handler group index
     */
    onStoryUpdate(handler: StoryUpdateHandler['callback'], group?: number): void

    /**
     * Register a story update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Story update handler
     * @param group  Handler group index
     */
    onStoryUpdate<Mod>(
        filter: UpdateFilter<UpdateContext<StoryUpdate>, Mod>,
        handler: StoryUpdateHandler<filters.Modify<UpdateContext<StoryUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onStoryUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('story', filter, handler, group)
    }

    /**
     * Register a delete story handler without any filters
     *
     * @param handler  Delete story handler
     * @param group  Handler group index
     */
    onDeleteStory(handler: DeleteStoryHandler['callback'], group?: number): void

    /**
     * Register a delete story handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Delete story handler
     * @param group  Handler group index
     */
    onDeleteStory<Mod>(
        filter: UpdateFilter<UpdateContext<DeleteStoryUpdate>, Mod>,
        handler: DeleteStoryHandler<filters.Modify<UpdateContext<DeleteStoryUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onDeleteStory(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('delete_story', filter, handler, group)
    }

    /**
     * Register a bot reaction update handler without any filters
     *
     * @param handler  Bot reaction update handler
     * @param group  Handler group index
     */
    onBotReactionUpdate(handler: BotReactionUpdateHandler['callback'], group?: number): void

    /**
     * Register a bot reaction update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Bot reaction update handler
     * @param group  Handler group index
     */
    onBotReactionUpdate<Mod>(
        filter: UpdateFilter<UpdateContext<BotReactionUpdate>, Mod>,
        handler: BotReactionUpdateHandler<filters.Modify<UpdateContext<BotReactionUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onBotReactionUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('bot_reaction', filter, handler, group)
    }

    /**
     * Register a bot reaction count update handler without any filters
     *
     * @param handler  Bot reaction count update handler
     * @param group  Handler group index
     */
    onBotReactionCountUpdate(handler: BotReactionCountUpdateHandler['callback'], group?: number): void

    /**
     * Register a bot reaction count update handler with a filter
     *
     * @param filter  Update filter
     * @param handler  Bot reaction count update handler
     * @param group  Handler group index
     */
    onBotReactionCountUpdate<Mod>(
        filter: UpdateFilter<UpdateContext<BotReactionCountUpdate>, Mod>,
        handler: BotReactionCountUpdateHandler<filters.Modify<UpdateContext<BotReactionCountUpdate>, Mod>>['callback'],
        group?: number,
    ): void

    /** @internal */
    onBotReactionCountUpdate(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('bot_reaction_count', filter, handler, group)
    }

    // end-codegen
}
