/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events'
import Long from 'long'

import { tl } from '@mtcute/tl'
import { __tlReaderMap as defaultReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap as defaultWriterMap } from '@mtcute/tl/binary/writer.js'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { BaseTelegramClientOptions } from './base-client.types.js'
import { ConfigManager } from './network/config-manager.js'
import { SessionConnection, TransportFactory } from './network/index.js'
import { NetworkManager, RpcCallOptions } from './network/network-manager.js'
import { ITelegramStorage } from './storage/index.js'
import { MustEqual } from './types/index.js'
import {
    ControllablePromise,
    createControllablePromise,
    defaultCryptoProviderFactory,
    defaultProductionDc,
    defaultProductionIpv6Dc,
    defaultTestDc,
    defaultTestIpv6Dc,
    getAllPeersFrom,
    ICryptoProvider,
    LogManager,
    readStringSession,
    StringSessionData,
    toggleChannelIdMark,
    writeStringSession,
} from './utils/index.js'

/**
 * Basic Telegram client that only implements the bare minimum
 * to make RPC calls and receive low-level updates.
 */
export class BaseTelegramClient extends EventEmitter {
    /**
     * Crypto provider taken from {@link BaseTelegramClientOptions.crypto}
     */
    readonly crypto: ICryptoProvider

    /**
     * Telegram storage taken from {@link BaseTelegramClientOptions.storage}
     */
    readonly storage: ITelegramStorage

    /**
     * API hash taken from {@link BaseTelegramClientOptions.apiHash}
     */
    protected readonly _apiHash: string

    /**
     * "Use IPv6" taken from {@link BaseTelegramClientOptions.useIpv6}
     */
    protected readonly _useIpv6: boolean

    /**
     * "Test mode" taken from {@link BaseTelegramClientOptions.testMode}
     */
    protected readonly _testMode: boolean

    /**
     * Primary DCs taken from {@link BaseTelegramClientOptions.defaultDcs},
     * loaded from session or changed by other means (like redirecting).
     */
    protected _defaultDcs: ITelegramStorage.DcOptions

    private _niceStacks: boolean
    /** TL layer used by the client */
    readonly _layer: number
    /** TL readers map used by the client */
    readonly _readerMap: TlReaderMap
    /** TL writers map used by the client */
    readonly _writerMap: TlWriterMap

    /** Unix timestamp when the last update was received */
    protected _lastUpdateTime = 0

    readonly _config = new ConfigManager(() => this.call({ _: 'help.getConfig' }))

    // not really connected, but rather "connect() was called"
    private _connected: ControllablePromise<void> | boolean = false

    _emitError: (err: unknown, connection?: SessionConnection) => void = console.error.bind(console)

    private _importFrom?: StringSessionData
    private _importForce?: boolean

    readonly log = new LogManager('client')
    readonly network: NetworkManager

    constructor(opts: BaseTelegramClientOptions) {
        super()

        const apiId = typeof opts.apiId === 'string' ? parseInt(opts.apiId) : opts.apiId

        if (isNaN(apiId)) {
            throw new Error('apiId must be a number or a numeric string!')
        }

        if (opts.logLevel !== undefined) {
            this.log.level = opts.logLevel
        }

        this.crypto = (opts.crypto ?? defaultCryptoProviderFactory)()

        this.storage = opts.storage
        this._apiHash = opts.apiHash
        this._useIpv6 = Boolean(opts.useIpv6)
        this._testMode = Boolean(opts.testMode)

        let dc = opts.defaultDcs

        if (!dc) {
            if (this._testMode) {
                dc = this._useIpv6 ? defaultTestIpv6Dc : defaultTestDc
            } else {
                dc = this._useIpv6 ? defaultProductionIpv6Dc : defaultProductionDc
            }
        }

        this._defaultDcs = dc
        this._niceStacks = opts.niceStacks ?? true

        this._layer = opts.overrideLayer ?? tl.LAYER
        this._readerMap = opts.readerMap ?? defaultReaderMap
        this._writerMap = opts.writerMap ?? defaultWriterMap

        this.network = new NetworkManager(
            {
                apiId,
                crypto: this.crypto,
                disableUpdates: opts.disableUpdates ?? false,
                initConnectionOptions: opts.initConnectionOptions,
                layer: this._layer,
                log: this.log,
                readerMap: this._readerMap,
                writerMap: this._writerMap,
                reconnectionStrategy: opts.reconnectionStrategy,
                storage: this.storage,
                testMode: this._testMode,
                transport: opts.transport,
                _emitError: this._emitError.bind(this),
                floodSleepThreshold: opts.floodSleepThreshold ?? 10000,
                maxRetryCount: opts.maxRetryCount ?? 5,
                isPremium: false,
                useIpv6: Boolean(opts.useIpv6),
                keepAliveAction: this._keepAliveAction.bind(this),
                enableErrorReporting: opts.enableErrorReporting ?? false,
                onUsable: () => this.emit('usable'),
                ...(opts.network ?? {}),
            },
            this._config,
        )

        this.storage.setup?.(this.log, this._readerMap, this._writerMap)
    }

    protected _keepAliveAction(): void {
        this.emit('keep_alive')
    }

    protected async _loadStorage(): Promise<void> {
        await this.storage.load?.()
    }

    _beforeStorageSave: (() => Promise<void>)[] = []

    beforeStorageSave(cb: () => Promise<void>): void {
        this._beforeStorageSave.push(cb)
    }

    offBeforeStorageSave(cb: () => Promise<void>): void {
        this._beforeStorageSave = this._beforeStorageSave.filter((x) => x !== cb)
    }

    async saveStorage(): Promise<void> {
        for (const cb of this._beforeStorageSave) {
            await cb()
        }
        await this.storage.save?.()
    }

    /**
     * Initialize the connection to the primary DC.
     *
     * You shouldn't usually call this method directly as it is called
     * implicitly the first time you call {@link call}.
     */
    async connect(): Promise<void> {
        if (this._connected) {
            // avoid double-connect
            await this._connected

            return
        }

        const promise = (this._connected = createControllablePromise())

        await this.crypto.initialize?.()
        await this._loadStorage()
        const primaryDc = await this.storage.getDefaultDcs()
        if (primaryDc !== null) this._defaultDcs = primaryDc

        const defaultDcAuthKey = await this.storage.getAuthKeyFor(this._defaultDcs.main.id)

        if ((this._importForce || !defaultDcAuthKey) && this._importFrom) {
            const data = this._importFrom

            if (data.testMode !== this._testMode) {
                throw new Error(
                    'This session string is not for the current backend. ' +
                        `Session is ${data.testMode ? 'test' : 'prod'}, but the client is ${
                            this._testMode ? 'test' : 'prod'
                        }`,
                )
            }

            this._defaultDcs = data.primaryDcs
            await this.storage.setDefaultDcs(data.primaryDcs)

            if (data.self) {
                await this.storage.setSelf(data.self)
            }

            // await this.primaryConnection.setupKeys(data.authKey)
            await this.storage.setAuthKeyFor(data.primaryDcs.main.id, data.authKey)

            await this.saveStorage()
        }

        this.emit('before_connect')

        this.network
            .connect(this._defaultDcs)
            .then(() => {
                promise.resolve()
                this._connected = true
            })
            .catch((err: Error) => this._emitError(err))
    }

    /**
     * Close all connections and finalize the client.
     */
    async close(): Promise<void> {
        this.emit('before_close')

        this._config.destroy()
        this.network.destroy()

        await this.saveStorage()
        await this.storage.destroy?.()

        this.emit('closed')
    }

    /**
     * Make an RPC call to the primary DC.
     * This method handles DC migration, flood waits and retries automatically.
     *
     * If you want more low-level control, use
     * `primaryConnection.sendForResult()` (which is what this method wraps)
     *
     * This method is still quite low-level and you shouldn't use this
     * when using high-level API provided by `@mtcute/client`.
     *
     * @param message  RPC method to call
     * @param params  Additional call parameters
     */
    async call<T extends tl.RpcMethod>(
        message: MustEqual<T, tl.RpcMethod>,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (this._connected !== true) {
            await this.connect()
        }

        const stack = this._niceStacks ? new Error().stack : undefined

        const res = await this.network.call(message, params, stack)

        if (await this._cachePeersFrom(res)) {
            await this.saveStorage()
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return res
    }

    /**
     * Create a Proxy that will call all methods with given call parameters
     * (see {@link RpcCallOptions}})
     *
     * This is useful when you don't call `call()` directly, but rather
     * use high-level API provided by `@mtcute/client`, for example:
     *
     * ```ts
     * const client = new TelegramClient(...)
     *
     * const someone = await client
     *   .withCallParams({ timeout: 500 })
     *   .getUsers(...)
     * ```
     */
    withCallParams(params: RpcCallOptions): this {
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop === 'call') {
                    return (message: tl.RpcMethod, paramsCustom?: RpcCallOptions) =>
                        target.call(message, {
                            ...params,
                            ...paramsCustom,
                        })
                }

                return Reflect.get(target, prop, receiver)
            },
        })
    }

    /**
     * Shorthand for `withCallParams({ abortSignal })`
     */
    withAbortSignal(signal: AbortSignal): this {
        return this.withCallParams({ abortSignal: signal })
    }

    /**
     * Change transport for the client.
     *
     * Can be used, for example, to change proxy at runtime
     *
     * This effectively calls `changeTransport()` on
     * `primaryConnection` and all additional connections.
     *
     * @param factory  New transport factory
     */
    changeTransport(factory: TransportFactory): void {
        this.network.changeTransport(factory)
    }

    /**
     * Register an error handler for the client
     *
     * @param handler
     *     Error handler. Called with one or two parameters.
     *     The first one is always the error, and the second is
     *     the connection in which the error has occurred, in case
     *     this was connection-related error.
     */
    onError(handler: (err: unknown, connection?: SessionConnection) => void): void {
        this._emitError = handler
    }

    notifyLoggedIn(auth: tl.auth.RawAuthorization): void {
        this.network.notifyLoggedIn(auth)
        this.emit('logged_in', auth)
    }

    /**
     * **ADVANCED**
     *
     * Adds all peers from a given object to entity cache in storage.
     */
    async _cachePeersFrom(obj: object): Promise<boolean> {
        const parsedPeers: ITelegramStorage.PeerInfo[] = []

        let count = 0

        for (const peer of getAllPeersFrom(obj as tl.TlObject)) {
            if ((peer as any).min) {
                // no point in caching min peers as we can't use them
                continue
            }

            count += 1

            switch (peer._) {
                case 'user':
                    if (!peer.accessHash) {
                        this.log.warn('received user without access hash: %j', peer)
                        continue
                    }

                    parsedPeers.push({
                        id: peer.id,
                        accessHash: peer.accessHash,
                        username: peer.username?.toLowerCase(),
                        phone: peer.phone,
                        type: 'user',
                        full: peer,
                    })
                    break
                case 'chat':
                case 'chatForbidden':
                    parsedPeers.push({
                        id: -peer.id,
                        accessHash: Long.ZERO,
                        type: 'chat',
                        full: peer,
                    })
                    break
                case 'channel':
                case 'channelForbidden':
                    if (!peer.accessHash) {
                        this.log.warn('received user without access hash: %j', peer)
                        continue
                    }
                    parsedPeers.push({
                        id: toggleChannelIdMark(peer.id),
                        accessHash: peer.accessHash,
                        username: peer._ === 'channel' ? peer.username?.toLowerCase() : undefined,
                        type: 'channel',
                        full: peer,
                    })
                    break
            }
        }

        if (count > 0) {
            await this.storage.updatePeers(parsedPeers)
            this.log.debug('cached %d peers', count)

            return true
        }

        return false
    }

    /**
     * Export current session to a single *LONG* string, containing
     * all the needed information.
     *
     * > **Warning!** Anyone with this string will be able
     * > to authorize as you and do anything. Treat this
     * > as your password, and never give it away!
     * >
     * > In case you have accidentally leaked this string,
     * > make sure to revoke this session in account settings:
     * > "Privacy & Security" > "Active sessions" >
     * > find the one containing `mtcute` > Revoke,
     * > or, in case this is a bot, revoke bot token
     * > with [@BotFather](//t.me/botfather)
     */
    async exportSession(): Promise<string> {
        const primaryDcs = (await this.storage.getDefaultDcs()) ?? this._defaultDcs

        const authKey = await this.storage.getAuthKeyFor(primaryDcs.main.id)
        if (!authKey) throw new Error('Auth key is not ready yet')

        return writeStringSession(this._writerMap, {
            version: 2,
            self: await this.storage.getSelf(),
            testMode: this._testMode,
            primaryDcs,
            authKey,
        })
    }

    /**
     * Request the session to be imported from the given session string.
     *
     * Note that the session will not be imported right away,
     * instead, it will be imported once `connect()` is called
     *
     * Also note that the session will only be imported in case
     * the storage is missing authorization (i.e. does not contain
     * auth key for the primary DC), otherwise it will be ignored (unless `force`).
     *
     * @param session  Session string to import
     * @param force  Whether to overwrite existing session
     */
    importSession(session: string | StringSessionData, force = false): void {
        this._importFrom = typeof session === 'string' ? readStringSession(this._readerMap, session) : session
        this._importForce = force
    }
}
