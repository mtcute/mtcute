import { tl } from '@mtcute/tl'
import {
    CryptoProviderFactory,
    ICryptoProvider,
    defaultCryptoProviderFactory,
    sleep,
    getAllPeersFrom,
    encodeUrlSafeBase64,
    parseUrlSafeBase64,
    LogManager,
    toggleChannelIdMark,
} from './utils'
import {
    TransportFactory,
    defaultReconnectionStrategy,
    ReconnectionStrategy,
    defaultTransportFactory,
    SessionConnection,
} from './network'
import { PersistentConnectionParams } from './network/persistent-connection'
import {
    defaultProductionDc,
    defaultProductionIpv6Dc,
    defaultTestDc,
    defaultTestIpv6Dc,
} from './utils/default-dcs'
import {
    AuthKeyUnregisteredError,
    FloodTestPhoneWaitError,
    FloodWaitError,
    InternalError,
    NetworkMigrateError,
    PhoneMigrateError,
    RpcError,
    SlowmodeWaitError,
    UserMigrateError,
} from '@mtcute/tl/errors'
import { addPublicKey } from './utils/crypto/keys'
import { ITelegramStorage, MemoryStorage } from './storage'
import EventEmitter from 'events'
import Long from 'long'
import {
    ControllablePromise,
    createControllablePromise,
} from './utils/controllable-promise'
import {
    TlBinaryReader,
    TlBinaryWriter,
    TlReaderMap,
    TlWriterMap,
} from '@mtcute/tl-runtime'

import defaultReaderMap from '@mtcute/tl/binary/reader'
import defaultWriterMap from '@mtcute/tl/binary/writer'

export namespace BaseTelegramClient {
    export interface Options {
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
        primaryDc?: tl.RawDcOption

        /**
         * Whether to connect to test servers.
         *
         * If passed, {@link primaryDc} defaults to Test DC 2.
         *
         * **Must** be passed if using test servers, even if
         * you passed custom {@link primaryDc}
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
         * If false, they will have a stack trace of MTCute internals.
         *
         * Internally this creates a stack capture before every RPC call
         * and stores it until the result is received. This might
         * use a lot more memory than normal, thus can be disabled here.
         *
         * @default true
         */
        niceStacks?: boolean

        /**
         * **EXPERT USE ONLY!**
         *
         * Override TL layer used for the connection.                                                                                                                                                                                                                                  /;'
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
}

export class BaseTelegramClient extends EventEmitter {
    /**
     * `initConnection` params taken from {@link BaseTelegramClient.Options.initConnectionOptions}.
     */
    protected readonly _initConnectionParams: tl.RawInitConnectionRequest

    /**
     * Crypto provider taken from {@link BaseTelegramClient.Options.crypto}
     */
    protected readonly _crypto: ICryptoProvider

    /**
     * Transport factory taken from {@link BaseTelegramClient.Options.transport}
     */
    protected readonly _transportFactory: TransportFactory

    /**
     * Telegram storage taken from {@link BaseTelegramClient.Options.storage}
     */
    readonly storage: ITelegramStorage

    /**
     * API hash taken from {@link BaseTelegramClient.Options.apiHash}
     */
    protected readonly _apiHash: string

    /**
     * "Use IPv6" taken from {@link BaseTelegramClient.Options.useIpv6}
     */
    protected readonly _useIpv6: boolean

    /**
     * "Test mode" taken from {@link BaseTelegramClient.Options.testMode}
     */
    protected readonly _testMode: boolean

    /**
     * Reconnection strategy taken from {@link BaseTelegramClient.Options.reconnectionStrategy}
     */
    protected readonly _reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>

    /**
     * Flood sleep threshold taken from {@link BaseTelegramClient.Options.floodSleepThreshold}
     */
    protected readonly _floodSleepThreshold: number

    /**
     * RPC retry count taken from {@link BaseTelegramClient.Options.rpcRetryCount}
     */
    protected readonly _rpcRetryCount: number

    /**
     * "Disable updates" taken from {@link BaseTelegramClient.Options.disableUpdates}
     */
    protected readonly _disableUpdates: boolean

    /**
     * Primary DC taken from {@link BaseTelegramClient.Options.primaryDc},
     * loaded from session or changed by other means (like redirecting).
     */
    protected _primaryDc: tl.RawDcOption

    private _niceStacks: boolean
    readonly _layer: number
    readonly _readerMap: TlReaderMap
    readonly _writerMap: TlWriterMap

    private _keepAliveInterval?: NodeJS.Timeout
    protected _lastUpdateTime = 0
    private _floodWaitedRequests: Record<string, number> = {}

    protected _config?: tl.RawConfig
    protected _cdnConfig?: tl.RawCdnConfig

    private _additionalConnections: SessionConnection[] = []

    // not really connected, but rather "connect() was called"
    private _connected: ControllablePromise<void> | boolean = false

    private _onError?: (err: Error, connection?: SessionConnection) => void

    /**
     * The primary {@link SessionConnection} that is used for
     * most of the communication with Telegram.
     *
     * Methods for downloading/uploading files may create additional connections as needed.
     */
    primaryConnection!: SessionConnection

    private _importFrom?: string

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

    constructor(opts: BaseTelegramClient.Options) {
        super()

        const apiId =
            typeof opts.apiId === 'string' ? parseInt(opts.apiId) : opts.apiId
        if (isNaN(apiId))
            throw new Error('apiId must be a number or a numeric string!')

        this._transportFactory = opts.transport ?? defaultTransportFactory
        this._crypto = (opts.crypto ?? defaultCryptoProviderFactory)()
        this.storage = opts.storage ?? new MemoryStorage()
        this._apiHash = opts.apiHash
        this._useIpv6 = !!opts.useIpv6
        this._testMode = !!opts.testMode
        this._primaryDc =
            opts.primaryDc ??
            (this._testMode
                ? this._useIpv6
                    ? defaultTestIpv6Dc
                    : defaultTestDc
                : this._useIpv6
                ? defaultProductionIpv6Dc
                : defaultProductionDc)
        this._reconnectionStrategy =
            opts.reconnectionStrategy ?? defaultReconnectionStrategy
        this._floodSleepThreshold = opts.floodSleepThreshold ?? 10000
        this._rpcRetryCount = opts.rpcRetryCount ?? 5
        this._disableUpdates = opts.disableUpdates ?? false
        this._niceStacks = opts.niceStacks ?? true

        this._layer = opts.overrideLayer ?? tl.LAYER
        this._readerMap = opts.readerMap ?? defaultReaderMap
        this._writerMap = opts.writerMap ?? defaultWriterMap

        this.storage.setup?.(this.log, this._readerMap, this._writerMap)

        let deviceModel = 'MTCute on '
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            const os = require('os')
            deviceModel += `${os.type()} ${os.arch()} ${os.release()}`
        } else if (typeof navigator !== 'undefined') {
            deviceModel += navigator.userAgent
        } else deviceModel += 'unknown'

        this._initConnectionParams = {
            _: 'initConnection',
            deviceModel,
            systemVersion: '1.0',
            appVersion: '1.0.0',
            systemLangCode: 'en',
            langPack: '', // "langPacks are for official apps only"
            langCode: 'en',
            ...(opts.initConnectionOptions ?? {}),
            apiId,
            query: null,
        }
    }

    protected async _loadStorage(): Promise<void> {
        await this.storage.load?.()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async _saveStorage(afterImport = false): Promise<void> {
        await this.storage.save?.()
    }

    protected _keepAliveAction(): void {
        if (this._disableUpdates) return

        // telegram asks to fetch pending updates
        // if there are no updates for 15 minutes.
        // core does not have update handling,
        // so we just use getState so the server knows
        // we still do need updates
        this.call({ _: 'updates.getState' }).catch((e) => {
            if (!(e instanceof RpcError)) {
                this.primaryConnection.reconnect()
            }
        })
    }

    private _cleanupPrimaryConnection(forever = false): void {
        if (forever && this.primaryConnection) this.primaryConnection.destroy()
        if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
    }

    private _setupPrimaryConnection(): void {
        this._cleanupPrimaryConnection(true)

        this.primaryConnection = new SessionConnection(
            {
                crypto: this._crypto,
                initConnection: this._initConnectionParams,
                transportFactory: this._transportFactory,
                dc: this._primaryDc,
                testMode: this._testMode,
                reconnectionStrategy: this._reconnectionStrategy,
                layer: this._layer,
                disableUpdates: this._disableUpdates,
                readerMap: this._readerMap,
                writerMap: this._writerMap,
            },
            this.log.create('connection')
        )

        this.primaryConnection.on('usable', async () => {
            this._lastUpdateTime = Date.now()

            this._keepAliveInterval = setInterval(async () => {
                if (Date.now() - this._lastUpdateTime > 900_000) {
                    this._keepAliveAction()
                    this._lastUpdateTime = Date.now()
                }
            }, 60_000)
        })
        this.primaryConnection.on('update', (update) => {
            this._lastUpdateTime = Date.now()
            this._handleUpdate(update)
        })
        this.primaryConnection.on('wait', () =>
            this._cleanupPrimaryConnection()
        )
        this.primaryConnection.on('key-change', async (key) => {
            this.storage.setAuthKeyFor(this._primaryDc.id, key)
            await this._saveStorage()
        })
        this.primaryConnection.on('error', (err) =>
            this._emitError(err, this.primaryConnection)
        )
    }

    /**
     * Initialize the connection to the primary DC.
     *
     * You shouldn't usually call this method directly as it is called
     * implicitly the first time you call {@link call}.
     */
    async connect(): Promise<void> {
        if (this._connected) {
            await this._connected
            return
        }

        this._connected = createControllablePromise()

        await this._loadStorage()
        const primaryDc = await this.storage.getDefaultDc()
        if (primaryDc !== null) this._primaryDc = primaryDc

        this._setupPrimaryConnection()

        await this.primaryConnection.setupKeys(
            await this.storage.getAuthKeyFor(this._primaryDc.id)
        )

        if (!this.primaryConnection.getAuthKey() && this._importFrom) {
            const buf = parseUrlSafeBase64(this._importFrom)
            if (buf[0] !== 1)
                throw new Error(`Invalid session string (version = ${buf[0]})`)

            const reader = new TlBinaryReader(this._readerMap, buf, 1)

            const flags = reader.int()
            const hasSelf = flags & 1

            if (!(flags & 2) !== !this._testMode) {
                throw new Error(
                    'This session string is not for the current backend'
                )
            }

            const primaryDc = reader.object()
            if (primaryDc._ !== 'dcOption') {
                throw new Error(
                    `Invalid session string (dc._ = ${primaryDc._})`
                )
            }

            this._primaryDc = this.primaryConnection.params.dc = primaryDc
            await this.storage.setDefaultDc(primaryDc)

            if (hasSelf) {
                const selfId = reader.int53()
                const selfBot = reader.boolean()

                await this.storage.setSelf({ userId: selfId, isBot: selfBot })
            }

            const key = reader.bytes()
            await this.primaryConnection.setupKeys(key)
            await this.storage.setAuthKeyFor(primaryDc.id, key)

            await this._saveStorage(true)
        }

        this._connected.resolve()
        this._connected = true

        this.primaryConnection.connect()
    }

    /**
     * Wait until this client is usable (i.e. connection is fully ready)
     */
    async waitUntilUsable(): Promise<void> {
        return new Promise((resolve) => {
            this.primaryConnection.once('usable', resolve)
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

        this._cleanupPrimaryConnection(true)
        // close additional connections
        this._additionalConnections.forEach((conn) => conn.destroy())

        await this._saveStorage()
        await this.storage.destroy?.()
    }

    /**
     * Utility function to find the DC by its ID.
     *
     * @param id  Datacenter ID
     * @param preferMedia  Whether to prefer media-only DCs
     * @param cdn  Whether the needed DC is a CDN DC
     */
    async getDcById(
        id: number,
        preferMedia = false,
        cdn = false
    ): Promise<tl.RawDcOption> {
        if (!this._config) {
            this._config = await this.call({ _: 'help.getConfig' })
        }

        if (cdn && !this._cdnConfig) {
            this._cdnConfig = await this.call({ _: 'help.getCdnConfig' })
            for (const key of this._cdnConfig.publicKeys) {
                await addPublicKey(this._crypto, key.publicKey)
            }
        }

        if (this._useIpv6) {
            // first try to find ipv6 dc

            let found
            if (preferMedia) {
                found = this._config.dcOptions.find(
                    (it) =>
                        it.id === id &&
                        it.mediaOnly &&
                        it.cdn === cdn &&
                        it.ipv6 &&
                        !it.tcpoOnly
                )
            }

            if (!found)
                found = this._config.dcOptions.find(
                    (it) =>
                        it.id === id &&
                        it.cdn === cdn &&
                        it.ipv6 &&
                        !it.tcpoOnly
                )

            if (found) return found
        }

        let found
        if (preferMedia) {
            found = this._config.dcOptions.find(
                (it) =>
                    it.id === id &&
                    it.mediaOnly &&
                    it.cdn === cdn &&
                    !it.tcpoOnly
            )
        }
        if (!found)
            found = this._config.dcOptions.find(
                (it) => it.id === id && it.cdn === cdn && !it.tcpoOnly
            )
        if (found) return found

        throw new Error(`Could not find${cdn ? ' CDN' : ''} DC ${id}`)
    }

    /**
     * Change primary DC and write that fact to the storage.
     * Will immediately reconnect to another DC.
     *
     * @param newDc  New DC or its ID
     */
    async changeDc(newDc: tl.RawDcOption | number): Promise<void> {
        if (typeof newDc === 'number') {
            newDc = await this.getDcById(newDc)
        }

        this._primaryDc = newDc
        await this.storage.setDefaultDc(newDc)
        await this._saveStorage()
        await this.primaryConnection.changeDc(newDc)
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
        message: T,
        params?: {
            throwFlood?: boolean
            connection?: SessionConnection
            timeout?: number
        }
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (this._connected !== true) {
            await this.connect()
        }

        // do not send requests that are in flood wait
        if (message._ in this._floodWaitedRequests) {
            const delta = Date.now() - this._floodWaitedRequests[message._]
            if (delta <= 3000) {
                // flood waits below 3 seconds are "ignored"
                delete this._floodWaitedRequests[message._]
            } else if (delta <= this._floodSleepThreshold) {
                await sleep(delta)
                delete this._floodWaitedRequests[message._]
            } else {
                throw new FloodWaitError(delta / 1000)
            }
        }

        const connection = params?.connection ?? this.primaryConnection

        let lastError: Error | null = null
        const stack = this._niceStacks ? new Error().stack : undefined

        for (let i = 0; i < this._rpcRetryCount; i++) {
            try {
                const res = await connection.sendRpc(
                    message,
                    stack,
                    params?.timeout
                )
                await this._cachePeersFrom(res)

                return res
            } catch (e) {
                lastError = e

                if (e instanceof InternalError) {
                    this.log.warn('Telegram is having internal issues: %s', e)
                    if (e.message === 'WORKER_BUSY_TOO_LONG_RETRY') {
                        // according to tdlib, "it is dangerous to resend query without timeout, so use 1"
                        await sleep(1000)
                    }
                    continue
                }

                if (
                    e.constructor === FloodWaitError ||
                    e.constructor === SlowmodeWaitError ||
                    e.constructor === FloodTestPhoneWaitError
                ) {
                    if (e.constructor !== SlowmodeWaitError) {
                        // SLOW_MODE_WAIT is chat-specific, not request-specific
                        this._floodWaitedRequests[message._] =
                            Date.now() + e.seconds * 1000
                    }

                    // In test servers, FLOOD_WAIT_0 has been observed, and sleeping for
                    // such a short amount will cause retries very fast leading to issues
                    if (e.seconds === 0) {
                        e.seconds = 1
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

                if (connection.params.dc.id === this._primaryDc.id) {
                    if (
                        e.constructor === PhoneMigrateError ||
                        e.constructor === UserMigrateError ||
                        e.constructor === NetworkMigrateError
                    ) {
                        this.log.info('Migrate error, new dc = %d', e.newDc)
                        await this.changeDc(e.newDc)
                        continue
                    }
                } else {
                    if (e.constructor === AuthKeyUnregisteredError) {
                        // we can try re-exporting auth from the primary connection
                        this.log.warn('exported auth key error, re-exporting..')

                        const auth = await this.call({
                            _: 'auth.exportAuthorization',
                            dcId: connection.params.dc.id,
                        })

                        await connection.sendRpc({
                            _: 'auth.importAuthorization',
                            id: auth.id,
                            bytes: auth.bytes,
                        })

                        continue
                    }
                }

                throw e
            }
        }

        throw lastError
    }

    /**
     * Creates an additional connection to a given DC.
     * This will use auth key for that DC that was already stored
     * in the session, or generate a new auth key by exporting
     * authorization from primary DC and importing it to the new DC.
     * New connection will use the same crypto provider, `initConnection`,
     * transport and reconnection strategy as the primary connection
     *
     * This method is quite low-level and you shouldn't usually care about this
     * when using high-level API provided by `@mtcute/client`.
     *
     * @param dcId  DC id, to which the connection will be created
     * @param cdn  Whether that DC is a CDN DC
     * @param inactivityTimeout
     *   Inactivity timeout for the connection (in ms), after which the transport will be closed.
     *   Note that connection can still be used normally, it's just the transport which is closed.
     *   Defaults to 5 min
     */
    async createAdditionalConnection(
        dcId: number,
        params?: {
            // todo proper docs
            // default = false
            media?: boolean
            // default = fa;se
            cdn?: boolean
            // default = 300_000
            inactivityTimeout?: number
            // default = false
            disableUpdates?: boolean
        }
    ): Promise<SessionConnection> {
        const dc = await this.getDcById(dcId, params?.media, params?.cdn)
        const connection = new SessionConnection(
            {
                dc,
                testMode: this._testMode,
                crypto: this._crypto,
                initConnection: this._initConnectionParams,
                transportFactory: this._transportFactory,
                reconnectionStrategy: this._reconnectionStrategy,
                inactivityTimeout: params?.inactivityTimeout ?? 300_000,
                layer: this._layer,
                disableUpdates: params?.disableUpdates,
                readerMap: this._readerMap,
                writerMap: this._writerMap,
            },
            this.log.create('connection')
        )

        connection.on('error', (err) => this._emitError(err, connection))
        await connection.setupKeys(await this.storage.getAuthKeyFor(dc.id))
        connection.connect()

        if (!connection.getAuthKey()) {
            this.log.info('exporting auth to DC %d', dcId)
            const auth = await this.call({
                _: 'auth.exportAuthorization',
                dcId,
            })
            await connection.sendRpc({
                _: 'auth.importAuthorization',
                id: auth.id,
                bytes: auth.bytes,
            })

            // connection.authKey was already generated at this point
            this.storage.setAuthKeyFor(dc.id, connection.getAuthKey()!)
            await this._saveStorage()
        } else {
            // in case the auth key is invalid
            const dcId = dc.id
            connection.on('key-change', async (key) => {
                // we don't need to export, it will be done by `.call()`
                // in case this error is returned
                //
                // even worse, exporting here will lead to a race condition,
                // and may result in redundant re-exports.

                this.storage.setAuthKeyFor(dcId, key)
                await this._saveStorage()
            })
        }

        this._additionalConnections.push(connection)

        return connection
    }

    /**
     * Destroy a connection that was previously created using {@link createAdditionalConnection}.
     * Passing any other connection will not have any effect.
     *
     * @param connection  Connection created with {@link createAdditionalConnection}
     */
    async destroyAdditionalConnection(
        connection: SessionConnection
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
        this.primaryConnection.changeTransport(factory)

        this._additionalConnections.forEach((conn) =>
            conn.changeTransport(factory)
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
    onError(
        handler: (err: Error, connection?: SessionConnection) => void
    ): void {
        this._onError = handler
    }

    protected _emitError(err: Error, connection?: SessionConnection): void {
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
        for (const peer of getAllPeersFrom(obj)) {
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
                    parsedPeers.push({
                        id: peer.id,
                        accessHash: peer.accessHash!,
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
                    parsedPeers.push({
                        id: toggleChannelIdMark(peer.id),
                        accessHash: peer.accessHash!,
                        username:
                            peer._ === 'channel'
                                ? peer.username?.toLowerCase()
                                : undefined,
                        type: 'channel',
                        full: peer,
                    })
                    break
            }
        }

        await this.storage.updatePeers(parsedPeers)

        if (count > 0) {
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
     * > find the one containing `MTCute` > Revoke,
     * > or, in case this is a bot, revoke bot token
     * > with [@BotFather](//t.me/botfather)
     */
    async exportSession(): Promise<string> {
        if (!this.primaryConnection.getAuthKey())
            throw new Error('Auth key is not generated yet')

        const writer = TlBinaryWriter.alloc(this._writerMap, 512)

        const self = await this.storage.getSelf()

        const version = 1
        let flags = 0

        if (self) {
            flags |= 1
        }

        if (this._testMode) {
            flags |= 2
        }

        writer.buffer[0] = version
        writer.pos += 1

        writer.int(flags)
        writer.object(this._primaryDc)

        if (self) {
            writer.int53(self.userId)
            writer.boolean(self.isBot)
        }

        writer.bytes(this.primaryConnection.getAuthKey()!)

        return encodeUrlSafeBase64(writer.result())
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
     */
    importSession(session: string): void {
        this._importFrom = session
    }
}
