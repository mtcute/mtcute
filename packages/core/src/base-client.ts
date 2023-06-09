/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events'
import Long from 'long'

import { tl } from '@mtcute/tl'
import defaultReaderMap from '@mtcute/tl/binary/reader'
import defaultWriterMap from '@mtcute/tl/binary/writer'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import {
    ReconnectionStrategy,
    SessionConnection,
    TransportFactory,
} from './network'
import { ConfigManager } from './network/config-manager'
import { NetworkManager, NetworkManagerExtraParams } from './network/network-manager'
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
    sleep,
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
        defaultDc?: tl.RawDcOption

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
    initConnectionOptions?: Partial<
        Omit<tl.RawInitConnectionRequest, 'apiId' | 'query'>
    >

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
    rpcRetryCount?: number

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
    protected readonly _crypto: ICryptoProvider

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
     * Flood sleep threshold taken from {@link BaseTelegramClientOptions.floodSleepThreshold}
     */
    protected readonly _floodSleepThreshold: number

    /**
     * RPC retry count taken from {@link BaseTelegramClientOptions.rpcRetryCount}
     */
    protected readonly _rpcRetryCount: number

    /**
     * Primary DC taken from {@link BaseTelegramClientOptions.defaultDc},
     * loaded from session or changed by other means (like redirecting).
     */
    protected _defaultDc: tl.RawDcOption

    private _niceStacks: boolean
    readonly _layer: number
    readonly _readerMap: TlReaderMap
    readonly _writerMap: TlWriterMap

    protected _lastUpdateTime = 0
    private _floodWaitedRequests: Record<string, number> = {}

    protected _config = new ConfigManager(() =>
        this.call({ _: 'help.getConfig' }),
    )

    private _additionalConnections: SessionConnection[] = []

    // not really connected, but rather "connect() was called"
    private _connected: ControllablePromise<void> | boolean = false

    private _onError?: (err: unknown, connection?: SessionConnection) => void

    private _importFrom?: string
    private _importForce?: boolean

    /**
     * Method which is called every time the client receives a new update.
     *
     * User of the class is expected to override it and handle the given update
     *
     * @param update  Raw update object sent by Telegram
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _handleUpdate(update: tl.TypeUpdates): void {}

    readonly log = new LogManager()
    readonly network: NetworkManager

    constructor(opts: BaseTelegramClientOptions) {
        super()

        const apiId =
            typeof opts.apiId === 'string' ? parseInt(opts.apiId) : opts.apiId

        if (isNaN(apiId)) {
            throw new Error('apiId must be a number or a numeric string!')
        }

        this._crypto = (opts.crypto ?? defaultCryptoProviderFactory)()
        this.storage = opts.storage ?? new MemoryStorage()
        this._apiHash = opts.apiHash
        this._useIpv6 = Boolean(opts.useIpv6)
        this._testMode = Boolean(opts.testMode)

        let dc = opts.defaultDc

        if (!dc) {
            if (this._testMode) {
                dc = this._useIpv6 ? defaultTestIpv6Dc : defaultTestDc
            } else {
                dc = this._useIpv6 ?
                    defaultProductionIpv6Dc :
                    defaultProductionDc
            }
        }

        this._defaultDc = dc
        this._floodSleepThreshold = opts.floodSleepThreshold ?? 10000
        this._rpcRetryCount = opts.rpcRetryCount ?? 5
        this._niceStacks = opts.niceStacks ?? true

        this._layer = opts.overrideLayer ?? tl.LAYER
        this._readerMap = opts.readerMap ?? defaultReaderMap
        this._writerMap = opts.writerMap ?? defaultWriterMap

        this.network = new NetworkManager({
            apiId,
            crypto: this._crypto,
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
            ...(opts.network ?? {}),
        }, this._config)

        this.storage.setup?.(this.log, this._readerMap, this._writerMap)
    }

    protected async _loadStorage(): Promise<void> {
        await this.storage.load?.()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async _saveStorage(afterImport = false): Promise<void> {
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

        this._connected = createControllablePromise()

        await this._loadStorage()
        const primaryDc = await this.storage.getDefaultDc()
        if (primaryDc !== null) this._defaultDc = primaryDc

        const defaultDcAuthKey = await this.storage.getAuthKeyFor(this._defaultDc.id)

        // await this.primaryConnection.setupKeys()

        if (
            (this._importForce || !defaultDcAuthKey) &&
            this._importFrom
        ) {
            const data = readStringSession(this._readerMap, this._importFrom)

            if (data.testMode !== !this._testMode) {
                throw new Error(
                    'This session string is not for the current backend',
                )
            }

            this._defaultDc = data.primaryDc
            await this.storage.setDefaultDc(data.primaryDc)

            if (data.self) {
                await this.storage.setSelf(data.self)
            }

            // await this.primaryConnection.setupKeys(data.authKey)
            await this.storage.setAuthKeyFor(data.primaryDc.id, data.authKey)

            await this._saveStorage(true)
        }

        this.network.connect(this._defaultDc)

        this._connected.resolve()
        this._connected = true
    }

    /**
     * Wait until this client is usable (i.e. connection is fully ready)
     */
    async waitUntilUsable(): Promise<void> {
        return new Promise((_resolve) => {
            // todo
            // this.primaryConnection.once('usable', resolve)
        })
    }

    /**
     * Additional cleanup for subclasses.
     * @protected
     */
    protected _onClose(): void {}

    /**
     * Close all connections and finalize the client.
     */
    async close(): Promise<void> {
        await this._onClose()

        this._config.destroy()
        this.network.destroy()

        // close additional connections
        this._additionalConnections.forEach((conn) => conn.destroy())

        await this._saveStorage()
        await this.storage.destroy?.()
    }

    /**
     * Change primary DC and write that fact to the storage.
     * Will immediately reconnect to another DC.
     *
     * @param newDc  New DC or its ID
     */
    async changeDc(newDc: tl.RawDcOption | number): Promise<void> {
        if (typeof newDc === 'number') {
            const res = await this._config.findOption({
                dcId: newDc,
                allowIpv6: this._useIpv6,
            })
            if (!res) throw new Error('DC not found')
            newDc = res
        }

        this._defaultDc = newDc
        await this.storage.setDefaultDc(newDc)
        await this._saveStorage()
        // todo
        // await this.primaryConnection.changeDc(newDc)
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
        params?: {
            throwFlood?: boolean
            connection?: SessionConnection
            timeout?: number
        },
    ): Promise<tl.RpcCallReturn[T['_']]> {
        // todo move to network manager
        if (this._connected !== true) {
            await this.connect()
        }

        // do not send requests that are in flood wait
        if (message._ in this._floodWaitedRequests) {
            const delta = this._floodWaitedRequests[message._] - Date.now()

            if (delta <= 3000) {
                // flood waits below 3 seconds are "ignored"
                delete this._floodWaitedRequests[message._]
            } else if (delta <= this._floodSleepThreshold) {
                await sleep(delta)
                delete this._floodWaitedRequests[message._]
            } else {
                throw new tl.errors.FloodWaitXError(delta / 1000)
            }
        }

        let lastError: Error | null = null
        const stack = this._niceStacks ? new Error().stack : undefined

        for (let i = 0; i < this._rpcRetryCount; i++) {
            try {
                // fixme temporary hack
                // eslint-disable-next-line dot-notation
                const res = await this.network['_primaryDc']!.mainConnection.sendRpc(
                    message,
                    stack,
                    params?.timeout,
                )
                await this._cachePeersFrom(res)

                return res
            } catch (e: any) {
                lastError = e

                if (e instanceof tl.errors.InternalError) {
                    this.log.warn('Telegram is having internal issues: %s', e)

                    if (e.message === 'WORKER_BUSY_TOO_LONG_RETRY') {
                        // according to tdlib, "it is dangerous to resend query without timeout, so use 1"
                        await sleep(1000)
                    }
                    continue
                }

                if (
                    e.constructor === tl.errors.FloodWaitXError ||
                    e.constructor === tl.errors.SlowmodeWaitXError ||
                    e.constructor === tl.errors.FloodTestPhoneWaitXError
                ) {
                    if (e.constructor !== tl.errors.SlowmodeWaitXError) {
                        // SLOW_MODE_WAIT is chat-specific, not request-specific
                        this._floodWaitedRequests[message._] =
                            Date.now() + e.seconds * 1000
                    }

                    // In test servers, FLOOD_WAIT_0 has been observed, and sleeping for
                    // such a short amount will cause retries very fast leading to issues
                    if (e.seconds === 0) {
                        (e as any).seconds = 1
                    }

                    if (
                        params?.throwFlood !== true &&
                        e.seconds <= this._floodSleepThreshold
                    ) {
                        this.log.info('Flood wait for %d seconds', e.seconds)
                        await sleep(e.seconds * 1000)
                        continue
                    }
                }

                // if (connection.params.dc.id === this._defaultDc.id) {
                //     if (
                //         e.constructor === tl.errors.PhoneMigrateXError ||
                //         e.constructor === tl.errors.UserMigrateXError ||
                //         e.constructor === tl.errors.NetworkMigrateXError
                //     ) {
                //         this.log.info('Migrate error, new dc = %d', e.new_dc)
                //         await this.changeDc(e.new_dc)
                //         continue
                //     }
                // } else {
                //     if (e.constructor === tl.errors.AuthKeyUnregisteredError) {
                //         // we can try re-exporting auth from the primary connection
                //         this.log.warn('exported auth key error, re-exporting..')
                //
                //         const auth = await this.call({
                //             _: 'auth.exportAuthorization',
                //             dcId: connection.params.dc.id,
                //         })
                //
                //         await connection.sendRpc({
                //             _: 'auth.importAuthorization',
                //             id: auth.id,
                //             bytes: auth.bytes,
                //         })
                //
                //         continue
                //     }
                // }

                throw e
            }
        }

        throw lastError
    }

    // /**
    //  * Creates an additional connection to a given DC.
    //  * This will use auth key for that DC that was already stored
    //  * in the session, or generate a new auth key by exporting
    //  * authorization from primary DC and importing it to the new DC.
    //  * New connection will use the same crypto provider, `initConnection`,
    //  * transport and reconnection strategy as the primary connection
    //  *
    //  * This method is quite low-level and you shouldn't usually care about this
    //  * when using high-level API provided by `@mtcute/client`.
    //  *
    //  * @param dcId  DC id, to which the connection will be created
    //  * @param cdn  Whether that DC is a CDN DC
    //  * @param inactivityTimeout
    //  *   Inactivity timeout for the connection (in ms), after which the transport will be closed.
    //  *   Note that connection can still be used normally, it's just the transport which is closed.
    //  *   Defaults to 5 min
    //  */
    // async createAdditionalConnection(
    //     dcId: number,
    //     params?: {
    //         // todo proper docs
    //         // default = false
    //         media?: boolean
    //         // default = fa;se
    //         cdn?: boolean
    //         // default = 300_000
    //         inactivityTimeout?: number
    //         // default = false
    //         disableUpdates?: boolean
    //     }
    // ): Promise<SessionConnection> {
    //     const dc = await this._config.findOption({
    //         dcId,
    //         preferMedia: params?.media,
    //         cdn: params?.cdn,
    //         allowIpv6: this._useIpv6,
    //     })
    //     if (!dc) throw new Error('DC not found')
    //     const connection = new SessionConnection(
    //         {
    //             dc,
    //             testMode: this._testMode,
    //             crypto: this._crypto,
    //             initConnection: this._initConnectionParams,
    //             transportFactory: this._transportFactory,
    //             reconnectionStrategy: this._reconnectionStrategy,
    //             inactivityTimeout: params?.inactivityTimeout ?? 300_000,
    //             layer: this._layer,
    //             disableUpdates: params?.disableUpdates,
    //             readerMap: this._readerMap,
    //             writerMap: this._writerMap,
    //         },
    //         this.log.create('connection')
    //     )
    //
    //     connection.on('error', (err) => this._emitError(err, connection))
    //     await connection.setupKeys(await this.storage.getAuthKeyFor(dc.id))
    //     connection.connect()
    //
    //     if (!connection.getAuthKey()) {
    //         this.log.info('exporting auth to DC %d', dcId)
    //         const auth = await this.call({
    //             _: 'auth.exportAuthorization',
    //             dcId,
    //         })
    //         await connection.sendRpc({
    //             _: 'auth.importAuthorization',
    //             id: auth.id,
    //             bytes: auth.bytes,
    //         })
    //
    //         // connection.authKey was already generated at this point
    //         this.storage.setAuthKeyFor(dc.id, connection.getAuthKey()!)
    //         await this._saveStorage()
    //     } else {
    //         // in case the auth key is invalid
    //         const dcId = dc.id
    //         connection.on('key-change', async (key) => {
    //             // we don't need to export, it will be done by `.call()`
    //             // in case this error is returned
    //             //
    //             // even worse, exporting here will lead to a race condition,
    //             // and may result in redundant re-exports.
    //
    //             this.storage.setAuthKeyFor(dcId, key)
    //             await this._saveStorage()
    //         })
    //     }
    //
    //     this._additionalConnections.push(connection)
    //
    //     return connection
    // }

    /**
     * Destroy a connection that was previously created using
     * {@link BaseTelegramClient.createAdditionalConnection}.
     * Passing any other connection will not have any effect.
     *
     * @param connection  Connection created with {@link BaseTelegramClient.createAdditionalConnection}
     */
    async destroyAdditionalConnection(
        connection: SessionConnection,
    ): Promise<void> {
        const idx = this._additionalConnections.indexOf(connection)
        if (idx === -1) return

        await connection.destroy()
        this._additionalConnections.splice(idx, 1)
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
        // todo
        // this.primaryConnection.changeTransport(factory)

        this._additionalConnections.forEach((conn) =>
            conn.changeTransport(factory),
        )
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
    onError(handler: typeof this._onError): void {
        this._onError = handler
    }

    protected _emitError(err: unknown, connection?: SessionConnection): void {
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
    protected async _cachePeersFrom(obj: object): Promise<boolean> {
        const parsedPeers: ITelegramStorage.PeerInfo[] = []

        let hadMin = false
        let count = 0

        for (const peer of getAllPeersFrom(obj as any)) {
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
                        this.log.warn(
                            'received user without access hash: %j',
                            peer,
                        )
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
                        this.log.warn(
                            'received user without access hash: %j',
                            peer,
                        )
                        continue
                    }
                    parsedPeers.push({
                        id: toggleChannelIdMark(peer.id),
                        accessHash: peer.accessHash,
                        username:
                            peer._ === 'channel' ?
                                peer.username?.toLowerCase() :
                                undefined,
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
        // todo
        // if (!this.primaryConnection.getAuthKey())
        //     throw new Error('Auth key is not generated yet')

        return writeStringSession(this._writerMap, {
            version: 1,
            self: await this.storage.getSelf(),
            testMode: this._testMode,
            primaryDc: this._defaultDc,
            authKey: Buffer.from([]), //this.primaryConnection.getAuthKey()!,
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
     * auth key for the primary DC), otherwise it will be ignored.
     *
     * @param session  Session string to import
     * @param force  Whether to overwrite existing session
     */
    importSession(session: string, force = false): void {
        this._importFrom = session
        this._importForce = force
    }
}
