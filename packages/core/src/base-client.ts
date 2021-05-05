import { tl } from '@mtcute/tl'
import {
    CryptoProviderFactory,
    ICryptoProvider,
    defaultCryptoProviderFactory,
} from './utils/crypto'
import {
    TransportFactory,
    defaultReconnectionStrategy,
    ReconnectionStrategy,
    defaultTransportFactory,
    TelegramConnection,
} from './network'
import { PersistentConnectionParams } from './network/persistent-connection'
import {
    defaultProductionDc,
    defaultProductionIpv6Dc,
} from './utils/default-dcs'
import {
    FloodTestPhoneWaitError,
    FloodWaitError,
    InternalError,
    NetworkMigrateError,
    PhoneMigrateError,
    RpcError,
    SlowmodeWaitError,
    UserMigrateError,
} from '@mtcute/tl/errors'
import { sleep } from './utils/misc-utils'
import { addPublicKey } from './utils/crypto/keys'
import { ITelegramStorage, MemoryStorage } from './storage'
import { getAllPeersFrom, MAX_CHANNEL_ID } from './utils/peer-utils'
import bigInt from 'big-integer'

const debug = require('debug')('mtcute:base')

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
    }
}

export class BaseTelegramClient {
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

    private _keepAliveInterval: NodeJS.Timeout
    private _lastRequestTime = 0
    private _floodWaitedRequests: Record<string, number> = {}

    protected _config?: tl.RawConfig
    protected _cdnConfig?: tl.RawCdnConfig

    private _additionalConnections: TelegramConnection[] = []

    // not really connected, but rather "connect() was called"
    private _connected = false

    private _onError?: (err: Error) => void

    /**
     * The primary {@link TelegramConnection} that is used for
     * most of the communication with Telegram.
     *
     * Methods for downloading/uploading files may create additional connections as needed.
     */
    primaryConnection: TelegramConnection

    /**
     * Method which is called every time the client receives a new update.
     *
     * User of the class is expected to override it and handle the given update
     *
     * @param update  Raw update object sent by Telegram
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _handleUpdate(update: tl.TypeUpdates): void {}

    /**
     * Method which is called for every object
     *
     * @param obj
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _processApiResponse(obj: tl.TlObject): void {}

    constructor(opts: BaseTelegramClient.Options) {
        const apiId =
            typeof opts.apiId === 'string' ? parseInt(opts.apiId) : opts.apiId
        if (isNaN(apiId))
            throw new Error('apiId must be a number or a numeric string!')

        this._transportFactory = opts.transport ?? defaultTransportFactory
        this._crypto = (opts.crypto ?? defaultCryptoProviderFactory)()
        this.storage = opts.storage ?? new MemoryStorage()
        this._apiHash = opts.apiHash
        this._useIpv6 = !!opts.useIpv6
        this._primaryDc =
            opts.primaryDc ??
            (this._useIpv6 ? defaultProductionIpv6Dc : defaultProductionDc)
        this._reconnectionStrategy =
            opts.reconnectionStrategy ?? defaultReconnectionStrategy
        this._floodSleepThreshold = opts.floodSleepThreshold ?? 10000
        this._rpcRetryCount = opts.rpcRetryCount ?? 5
        this._disableUpdates = opts.disableUpdates ?? false
        this._niceStacks = opts.niceStacks ?? true

        let deviceModel = 'mtcute on '
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

    protected async _saveStorage(): Promise<void> {
        await this.storage.save?.()
    }

    private _cleanupPrimaryConnection(forever = false): void {
        if (forever && this.primaryConnection) this.primaryConnection.destroy()
        if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
    }

    private _setupPrimaryConnection(): void {
        this._cleanupPrimaryConnection(true)

        this.primaryConnection = new TelegramConnection({
            crypto: this._crypto,
            initConnection: this._initConnectionParams,
            transportFactory: this._transportFactory,
            dc: this._primaryDc,
            reconnectionStrategy: this._reconnectionStrategy,
        })
        this.primaryConnection.on('usable', async () => {
            this._keepAliveInterval = setInterval(async () => {
                // according to telethon, "We need to send some content-related request at least hourly
                // for Telegram to keep delivering updates, otherwise they will just stop even if we're connected.
                // Do so every 30 minutes"
                if (Date.now() - this._lastRequestTime > 1800_000) {
                    try {
                        await this.call({ _: 'updates.getState' })
                    } catch (e) {
                        if (!(e instanceof RpcError)) {
                            this.primaryConnection.reconnect()
                        }
                    }
                }
            }, 60_000)

            if (!this.primaryConnection._initConnectionCalled) {
                // initial call that will be wrapped with initConnection
                await this.call({ _: 'help.getConfig' }).catch((err) =>
                    this.primaryConnection.emit('error', err)
                )
            }

            // on reconnection we need to call updates.getState so Telegram
            // knows we still want the updates
            if (!this._disableUpdates) {
                try {
                    await this.call({ _: 'updates.getState' })
                } catch (e) {
                    if (!(e instanceof RpcError)) {
                        this.primaryConnection.reconnect()
                    }
                }
            }
        })
        this.primaryConnection.on('update', (update) => {
            this._handleUpdate(update)
        })
        this.primaryConnection.on('wait', () =>
            this._cleanupPrimaryConnection()
        )
        this.primaryConnection.on('key-change', async (key) => {
            this.storage.setAuthKeyFor(this._primaryDc.id, key)
            await this._saveStorage()
        })
        this.primaryConnection.on('error', (err) => this._emitError(err))
    }

    /**
     * Initialize the connection to the primary DC.
     *
     * You shouldn't usually call this method directly as it is called
     * implicitly the first time you call {@link call}.
     */
    async connect(): Promise<void> {
        await this._loadStorage()
        const primaryDc = await this.storage.getDefaultDc()
        if (primaryDc !== null) this._primaryDc = primaryDc

        this._connected = true
        this._setupPrimaryConnection()

        this.primaryConnection.authKey = await this.storage.getAuthKeyFor(
            this._primaryDc.id
        )
        this.primaryConnection.connect()
    }

    /**
     * Close all connections and finalize the client.
     */
    async close(): Promise<void> {
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
     * @param cdn  Whether the needed DC is a CDN DC
     */
    async getDcById(id: number, cdn = false): Promise<tl.RawDcOption> {
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
            const found = this._config.dcOptions.find(
                (it) => it.id === id && it.cdn === cdn && it.ipv6
            )
            if (found) return found
        }

        const found = this._config.dcOptions.find(
            (it) => it.id === id && it.cdn === cdn
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
        this.primaryConnection.changeDc(newDc)
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
            connection?: TelegramConnection
        }
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (!this._connected) {
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

        if (this._disableUpdates) {
            message = {
                _: 'invokeWithoutUpdates',
                query: message,
            } as any // who cares
        }

        this._lastRequestTime = Date.now()

        const connection = params?.connection ?? this.primaryConnection

        let lastError: Error | null = null
        const stack = this._niceStacks ? new Error().stack : undefined

        for (let i = 0; i < this._rpcRetryCount; i++) {
            try {
                const res = await connection.sendForResult(message, stack)
                await this._cachePeersFrom(res)

                return res
            } catch (e) {
                lastError = e

                if (e instanceof InternalError) {
                    debug('Telegram is having internal issues: %s', e)
                    if (e.message === 'WORKER_BUSY_TOO_LONG_RETRY') {
                        // according to tdlib, "it is dangerous to resend query without timeout, so use 1"
                        await sleep(1000)
                    }
                    continue
                }

                if (
                    e instanceof FloodWaitError ||
                    e instanceof SlowmodeWaitError ||
                    e instanceof FloodTestPhoneWaitError
                ) {
                    if (!(e instanceof SlowmodeWaitError)) {
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
                        debug('Flood wait for %d seconds', e.seconds)
                        await sleep(e.seconds * 1000)
                        continue
                    }
                }
                if (
                    connection === this.primaryConnection &&
                    (e instanceof PhoneMigrateError ||
                        e instanceof UserMigrateError ||
                        e instanceof NetworkMigrateError)
                ) {
                    debug('Migrate error, new dc = %d', e.newDc)
                    await this.changeDc(e.newDc)
                    continue
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
        cdn = false,
        inactivityTimeout = 300_000
    ): Promise<TelegramConnection> {
        const dc = await this.getDcById(dcId, cdn)
        const connection = new TelegramConnection({
            dc,
            crypto: this._crypto,
            initConnection: this._initConnectionParams,
            transportFactory: this._transportFactory,
            reconnectionStrategy: this._reconnectionStrategy,
            inactivityTimeout,
        })

        connection.on('error', (err) => this._emitError(err))
        connection.authKey = await this.storage.getAuthKeyFor(dc.id)
        connection.connect()

        if (!connection.authKey) {
            debug('exporting auth to DC %d', dcId)
            const auth = await this.call({
                _: 'auth.exportAuthorization',
                dcId,
            })
            await connection.sendForResult({
                _: 'auth.importAuthorization',
                id: auth.id,
                bytes: auth.bytes,
            })

            // connection.authKey was already generated at this point
            this.storage.setAuthKeyFor(dc.id, connection.authKey)
            await this._saveStorage()
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
        connection: TelegramConnection
    ): Promise<void> {
        const idx = this._additionalConnections.indexOf(connection)
        if (idx === -1) return

        await connection.destroy()
        this._additionalConnections.splice(idx, 1)
    }

    onError(handler: (err: Error) => void): void {
        this._onError = handler
    }

    protected _emitError(err: Error): void {
        if (this._onError) {
            this._onError(err)
        } else {
            console.error(err)
        }
    }

    /**
     * Adds all peers from a given object to entity cache in storage.
     */
    protected async _cachePeersFrom(obj: any): Promise<void> {
        const parsedPeers: ITelegramStorage.PeerInfo[] = []

        for (const peer of getAllPeersFrom(obj)) {
            if ((peer as any).min && !peer.fromMessage && !(peer as any).bot) {
                debug('peer is min, but no context was found: %o %o', obj, peer)
                continue
            }

            if (peer._ === 'user') {
                parsedPeers.push({
                    id: peer.id,
                    accessHash: peer.accessHash!,
                    username: peer.username?.toLowerCase() ?? null,
                    phone: peer.phone ?? null,
                    type: peer.bot ? 'bot' : 'user',
                    updated: 0,
                    fromMessage: peer.fromMessage,
                })
            } else if (peer._ === 'chat' || peer._ === 'chatForbidden') {
                parsedPeers.push({
                    id: -peer.id,
                    accessHash: bigInt.zero,
                    username: null,
                    phone: null,
                    type: 'group',
                    updated: 0,
                    fromMessage: peer.fromMessage,
                })
            } else if (peer._ === 'channel' || peer._ === 'channelForbidden') {
                parsedPeers.push({
                    id: MAX_CHANNEL_ID - peer.id,
                    accessHash: peer.accessHash!,
                    username:
                        peer._ === 'channel'
                            ? peer.username?.toLowerCase() ?? null
                            : null,
                    phone: null,
                    type: peer.broadcast ? 'channel' : 'supergroup',
                    updated: 0,
                    fromMessage: peer.fromMessage,
                })
            }
        }

        await this.storage.updatePeers(parsedPeers)
        await this._saveStorage()
    }
}
