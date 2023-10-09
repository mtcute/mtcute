/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events'
import Long from 'long'

import { tl } from '@mtcute/tl'
import defaultReaderMap from '@mtcute/tl/binary/reader'
import defaultWriterMap from '@mtcute/tl/binary/writer'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { ReconnectionStrategy, SessionConnection, TransportFactory } from './network'
import { ConfigManager } from './network/config-manager'
import { NetworkManager, NetworkManagerExtraParams, RpcCallOptions } from './network/network-manager'
import { PersistentConnectionParams } from './network/persistent-connection'
import { ITelegramStorage, MemoryStorage } from './storage'
import { MustEqual } from './types'
import {
    ControllablePromise,
    createControllablePromise,
    CryptoProviderFactory,
    defaultCryptoProviderFactory,
    defaultProductionDc,
    defaultProductionIpv6Dc,
    defaultTestDc,
    defaultTestIpv6Dc,
    getAllPeersFrom,
    ICryptoProvider,
    LogManager,
    readStringSession,
    toggleChannelIdMark,
    writeStringSession,
} from './utils'

export interface BaseTelegramClientOptions {
    /**
     * API ID from my.telegram.org
     */
    apiId: number | string
    /**
     * API hash from my.telegram.org
     */
    apiHash: string

    /**
     * Telegram storage to use.
     * If omitted, {@link MemoryStorage} is used
     */
    storage?: ITelegramStorage

    /**
     * Cryptography provider factory to allow delegating
     * crypto to native addon, worker, etc.
     */
    crypto?: CryptoProviderFactory

    /**
     * Whether to use IPv6 datacenters
     * (IPv6 will be preferred when choosing a DC by id)
     * (default: false)
     */
    useIpv6?: boolean

    /**
     * Primary DC to use for initial connection.
     * This does not mean this will be the only DC used,
     * nor that this DC will actually be primary, this only
     * determines the first DC the library will try to connect to.
     * Can be used to connect to other networks (like test DCs).
     *
     * When session already contains primary DC, this parameter is ignored.
     * Defaults to Production DC 2.
     */
    defaultDcs?: ITelegramStorage.DcOptions

    /**
     * Whether to connect to test servers.
     *
     * If passed, {@link defaultDc} defaults to Test DC 2.
     *
     * **Must** be passed if using test servers, even if
     * you passed custom {@link defaultDc}
     */
    testMode?: boolean

    /**
     * Additional options for initConnection call.
     * `apiId` and `query` are not available and will be ignored.
     * Omitted values will be filled with defaults
     */
    initConnectionOptions?: Partial<Omit<tl.RawInitConnectionRequest, 'apiId' | 'query'>>

    /**
     * Transport factory to use in the client.
     * Defaults to platform-specific transport: WebSocket on the web, TCP in node
     */
    transport?: TransportFactory

    /**
     * Reconnection strategy.
     * Defaults to simple reconnection strategy: first 0ms, then up to 5s (increasing by 1s)
     */
    reconnectionStrategy?: ReconnectionStrategy<PersistentConnectionParams>

    /**
     * Maximum duration of a flood_wait that will be waited automatically.
     * Flood waits above this threshold will throw a FloodWaitError.
     * Set to 0 to disable. Can be overridden with `throwFlood` parameter in call() params
     *
     * @default 10000
     */
    floodSleepThreshold?: number

    /**
     * Maximum number of retries when calling RPC methods.
     * Call is retried when InternalError or FloodWaitError is encountered.
     * Can be set to Infinity.
     *
     * @default 5
     */
    maxRetryCount?: number

    /**
     * If true, every single API call will be wrapped with `tl.invokeWithoutUpdates`,
     * effectively disabling the server-sent events for the clients.
     * May be useful in some cases.
     *
     * Note that this only wraps calls made with `.call()` within the primary
     * connection. Additional connections and direct `.sendForResult()` calls
     * must be wrapped manually.
     *
     * @default false
     */
    disableUpdates?: boolean

    /**
     * mtcute can send all unknown RPC errors to [danog](https://github.com/danog)'s
     * [error reporting service](https://rpc.pwrtelegram.xyz/).
     *
     * This is fully anonymous (except maybe IP) and is only used to improve the library
     * and developer experience for everyone working with MTProto. This is fully opt-in,
     * and if you're too paranoid, you can disable it by manually passing `enableErrorReporting: false` to the client.
     *
     * @default false
     */
    enableErrorReporting?: boolean

    /**
     * If true, RPC errors will have a stack trace of the initial `.call()`
     * or `.sendForResult()` call position, which drastically improves
     * debugging experience.<br>
     * If false, they will have a stack trace of mtcute internals.
     *
     * Internally this creates a stack capture before every RPC call
     * and stores it until the result is received. This might
     * use a lot more memory than normal, thus can be disabled here.
     *
     * @default true
     */
    niceStacks?: boolean

    /**
     * Extra parameters for {@link NetworkManager}
     */
    network?: NetworkManagerExtraParams

    /**
     * **EXPERT USE ONLY!**
     *
     * Override TL layer used for the connection.
     *
     * **Does not** change the schema used.
     */
    overrideLayer?: number

    /**
     * **EXPERT USE ONLY**
     *
     * Override reader map used for the connection.
     */
    readerMap?: TlReaderMap

    /**
     * **EXPERT USE ONLY**
     *
     * Override writer map used for the connection.
     */
    writerMap?: TlWriterMap
}

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
    readonly _layer: number
    readonly _readerMap: TlReaderMap
    readonly _writerMap: TlWriterMap

    protected _lastUpdateTime = 0

    protected _config = new ConfigManager(() => this.call({ _: 'help.getConfig' }))

    // not really connected, but rather "connect() was called"
    private _connected: ControllablePromise<void> | boolean = false

    private _onError?: (err: unknown, connection?: SessionConnection) => void

    private _importFrom?: string
    private _importForce?: boolean

    readonly log = new LogManager('client')
    readonly network: NetworkManager

    constructor(opts: BaseTelegramClientOptions) {
        super()

        const apiId = typeof opts.apiId === 'string' ? parseInt(opts.apiId) : opts.apiId

        if (isNaN(apiId)) {
            throw new Error('apiId must be a number or a numeric string!')
        }

        this.crypto = (opts.crypto ?? defaultCryptoProviderFactory)()
        this.storage = opts.storage ?? new MemoryStorage()
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

        await this._loadStorage()
        const primaryDc = await this.storage.getDefaultDcs()
        if (primaryDc !== null) this._defaultDcs = primaryDc

        const defaultDcAuthKey = await this.storage.getAuthKeyFor(this._defaultDcs.main.id)

        if ((this._importForce || !defaultDcAuthKey) && this._importFrom) {
            const data = readStringSession(this._readerMap, this._importFrom)

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
        await this._cachePeersFrom(res)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return res
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
        this._onError = handler
    }

    notifyLoggedIn(auth: tl.auth.RawAuthorization): void {
        this.network.notifyLoggedIn(auth)
        this.emit('logged_in', auth)
    }

    _emitError(err: unknown, connection?: SessionConnection): void {
        if (this._onError) {
            this._onError(err, connection)
        } else {
            console.error(err)
        }
    }

    /**
     * Adds all peers from a given object to entity cache in storage.
     *
     * @returns  `true` if there were any `min` peers
     */
    async _cachePeersFrom(obj: object): Promise<boolean> {
        const parsedPeers: ITelegramStorage.PeerInfo[] = []

        let hadMin = false
        let count = 0

        for (const peer of getAllPeersFrom(obj as tl.TlObject)) {
            if ((peer as any).min) {
                // absolutely incredible min peer handling, courtesy of levlam.
                // see this thread: https://t.me/tdlibchat/15084
                hadMin = true
                this.log.debug('received min peer: %j', peer)
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
        }

        return hadMin
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
        const primaryDcs = await this.storage.getDefaultDcs()
        if (!primaryDcs) throw new Error('No default DC set')

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
     * Note that the string will not be parsed and imported right away,
     * instead, it will be imported when `connect()` is called
     *
     * Also note that the session will only be imported in case
     * the storage is missing authorization (i.e. does not contain
     * auth key for the primary DC), otherwise it will be ignored (unless `force).
     *
     * @param session  Session string to import
     * @param force  Whether to overwrite existing session
     */
    importSession(session: string, force = false): void {
        this._importFrom = session
        this._importForce = force
    }
}
