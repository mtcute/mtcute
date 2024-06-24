/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events'

import { tl } from '@mtcute/tl'
import { __tlReaderMap as defaultReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap as defaultWriterMap } from '@mtcute/tl/binary/writer.js'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { IMtStorageProvider } from '../storage/provider.js'
import { StorageManager, StorageManagerExtraOptions } from '../storage/storage.js'
import { MustEqual } from '../types/index.js'
import {
    asyncResettable,
    DcOptions,
    defaultProductionDc,
    defaultProductionIpv6Dc,
    defaultTestDc,
    defaultTestIpv6Dc,
    ICryptoProvider,
    Logger,
    LogManager,
} from '../utils/index.js'
import { ConfigManager } from './config-manager.js'
import { NetworkManager, NetworkManagerExtraParams, RpcCallOptions } from './network-manager.js'
import { PersistentConnectionParams } from './persistent-connection.js'
import { ReconnectionStrategy } from './reconnection.js'
import { TransportFactory } from './transports/index.js'

/** Options for {@link MtClient} */
export interface MtClientOptions {
    /**
     * API ID from my.telegram.org
     */
    apiId: number
    /**
     * API hash from my.telegram.org
     */
    apiHash: string

    /**
     * Storage to use for this client.
     */
    storage: IMtStorageProvider

    /** Additional options for the storage manager */
    storageOptions?: StorageManagerExtraOptions

    /**
     * Cryptography provider to allow delegating
     * crypto to native addon, worker, etc.
     */
    crypto: ICryptoProvider

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
     *
     * @default  Production DC 2.
     */
    defaultDcs?: DcOptions

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
     *
     * @default  platform-specific transport: WebSocket on the web, TCP in node
     */
    transport: TransportFactory

    /**
     * Reconnection strategy.
     *
     * @default  simple reconnection strategy: first 0ms, then up to 5s (increasing by 1s)
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
     * If true, all API calls will be wrapped with `tl.invokeWithoutUpdates`,
     * effectively disabling the server-sent events for the clients.
     * May be useful in some cases.
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
     * Logger instance for the client.
     * If not passed, a new one will be created.
     */
    logger?: Logger

    /**
     * Set logging level for the client.
     * Shorthand for `client.log.level = level`.
     *
     * See static members of {@link LogManager} for possible values.
     */
    logLevel?: number

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

/**
 * Basic MTProto client implementation, only doing the bare minimum
 * to make RPC calls and receive low-level updates, as well as providing
 * some APIs to manage that.
 */
export class MtClient extends EventEmitter {
    /**
     * Crypto provider taken from {@link MtClientOptions.crypto}
     */
    readonly crypto: ICryptoProvider

    /** Storage manager */
    readonly storage: StorageManager

    /**
     * "Test mode" taken from {@link MtClientOptions.testMode}
     */
    protected readonly _testMode: boolean

    /**
     * Primary DCs taken from {@link MtClientOptions.defaultDcs},
     * loaded from session or changed by other means (like redirecting).
     */
    _defaultDcs: DcOptions

    private _niceStacks: boolean
    /** TL layer used by the client */
    readonly _layer: number
    /** TL readers map used by the client */
    readonly _readerMap: TlReaderMap
    /** TL writers map used by the client */
    readonly _writerMap: TlWriterMap

    readonly _config = new ConfigManager(() => this.call({ _: 'help.getConfig' }))

    private _emitError?: (err: unknown) => void

    readonly log: Logger
    readonly network: NetworkManager

    private _abortController: AbortController
    readonly stopSignal: AbortSignal

    constructor(readonly params: MtClientOptions) {
        super()

        this.log = params.logger ?? new LogManager()

        if (params.logLevel !== undefined) {
            this.log.mgr.level = params.logLevel
        }

        this.crypto = params.crypto
        this._testMode = Boolean(params.testMode)

        let dc = params.defaultDcs

        if (!dc) {
            if (params.testMode) {
                dc = params.useIpv6 ? defaultTestIpv6Dc : defaultTestDc
            } else {
                dc = params.useIpv6 ? defaultProductionIpv6Dc : defaultProductionDc
            }
        }

        this._defaultDcs = dc
        this._niceStacks = params.niceStacks ?? true

        this._layer = params.overrideLayer ?? tl.LAYER
        this._readerMap = params.readerMap ?? defaultReaderMap
        this._writerMap = params.writerMap ?? defaultWriterMap

        this._abortController = new AbortController()
        this.stopSignal = this._abortController.signal

        this.storage = new StorageManager({
            provider: params.storage,
            log: this.log,
            readerMap: this._readerMap,
            writerMap: this._writerMap,
            ...params.storageOptions,
        })

        this.network = new NetworkManager(
            {
                apiId: params.apiId,
                crypto: this.crypto,
                disableUpdates: params.disableUpdates ?? false,
                initConnectionOptions: params.initConnectionOptions,
                layer: this._layer,
                log: this.log,
                readerMap: this._readerMap,
                writerMap: this._writerMap,
                reconnectionStrategy: params.reconnectionStrategy,
                storage: this.storage,
                testMode: Boolean(params.testMode),
                transport: params.transport,
                emitError: this.emitError.bind(this),
                floodSleepThreshold: params.floodSleepThreshold ?? 10000,
                maxRetryCount: params.maxRetryCount ?? 5,
                isPremium: false,
                useIpv6: Boolean(params.useIpv6),
                enableErrorReporting: params.enableErrorReporting ?? false,
                onUsable: () => this.emit('usable'),
                onConnecting: () => this.emit('connecting'),
                onNetworkChanged: (connected) => this.emit('networkChanged', connected),
                onUpdate: (upd) => this.emit('update', upd),
                stopSignal: this.stopSignal,
                ...params.network,
            },
            this._config,
        )
    }

    emitError(err: unknown): void {
        if (this._emitError) {
            this._emitError(err)
        } else if (this._connect.finished()) {
            this.log.error('unhandled error:', err)
        }
    }

    private _prepare = asyncResettable(async () => {
        await this.crypto.initialize?.()
        await this.storage.load()

        const primaryDc = await this.storage.dcs.fetch()
        if (primaryDc !== null) this._defaultDcs = primaryDc
    })

    /**
     * **ADVANCED**
     *
     * Do all the preparations, but don't connect just yet.
     * Useful when you want to do some preparations before
     * connecting, like setting up session.
     *
     * Call {@link connect} to actually connect.
     */
    prepare() {
        return this._prepare.run()
    }

    private _connect = asyncResettable(async () => {
        await this._prepare.run()
        await this.network.connect(this._defaultDcs)
    })

    /**
     * Initialize the connection to the primary DC.
     *
     * You shouldn't usually call this method directly as it is called
     * implicitly the first time you call {@link call}.
     */
    async connect(): Promise<void> {
        return this._connect.run()
    }

    /**
     * Close all connections and finalize the client.
     */
    async close(): Promise<void> {
        this.log.debug('closing client')

        this._config.destroy()
        await this.network.destroy()

        await this.storage.save()
        await this.storage.destroy?.()

        this._prepare.reset()
        this._connect.reset()
        this._abortController.abort()

        this.log.debug('client closed successfully')
    }

    /**
     * Make an RPC call.
     *
     * The connection must have been {@link connect}-ed
     * before calling this method.
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
        const stack = this._niceStacks ? new Error().stack : undefined

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.network.call(message, params, stack)
    }

    /**
     * Register an error handler for the client
     *
     * @param handler Error handler.
     */
    onError(handler: (err: unknown) => void): void {
        this._emitError = handler
    }
}
