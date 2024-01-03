/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events'

import { tl } from '@mtcute/tl'
import { __tlReaderMap as defaultReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap as defaultWriterMap } from '@mtcute/tl/binary/writer.js'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { BaseTelegramClientOptions } from './base-client.types.js'
import { ConfigManager } from './network/config-manager.js'
import { SessionConnection } from './network/index.js'
import { NetworkManager, RpcCallOptions } from './network/network-manager.js'
import { StorageManager } from './storage/storage.js'
import { MustEqual } from './types/index.js'
import {
    ControllablePromise,
    createControllablePromise,
    DcOptions,
    defaultCryptoProviderFactory,
    defaultProductionDc,
    defaultProductionIpv6Dc,
    defaultTestDc,
    defaultTestIpv6Dc,
    ICryptoProvider,
    LogManager,
    readStringSession,
    StringSessionData,
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

    /** Storage manager */
    readonly storage: StorageManager

    /**
     * "Test mode" taken from {@link BaseTelegramClientOptions.testMode}
     */
    protected readonly _testMode: boolean

    /**
     * Primary DCs taken from {@link BaseTelegramClientOptions.defaultDcs},
     * loaded from session or changed by other means (like redirecting).
     */
    protected _defaultDcs: DcOptions

    private _niceStacks: boolean
    /** TL layer used by the client */
    readonly _layer: number
    /** TL readers map used by the client */
    readonly _readerMap: TlReaderMap
    /** TL writers map used by the client */
    readonly _writerMap: TlWriterMap

    readonly _config = new ConfigManager(() => this.call({ _: 'help.getConfig' }))

    // not really connected, but rather "connect() was called"
    private _connected: ControllablePromise<void> | boolean = false

    _emitError: (err: unknown, connection?: SessionConnection) => void = console.error.bind(console)

    private _importFrom?: StringSessionData
    private _importForce?: boolean

    readonly log = new LogManager('client')
    readonly network: NetworkManager

    constructor(readonly params: BaseTelegramClientOptions) {
        super()

        if (params.logLevel !== undefined) {
            this.log.level = params.logLevel
        }

        this.crypto = (params.crypto ?? defaultCryptoProviderFactory)()
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
                _emitError: this._emitError.bind(this),
                floodSleepThreshold: params.floodSleepThreshold ?? 10000,
                maxRetryCount: params.maxRetryCount ?? 5,
                isPremium: false,
                useIpv6: Boolean(params.useIpv6),
                enableErrorReporting: params.enableErrorReporting ?? false,
                onUsable: () => this.emit('usable'),
                ...params.network,
            },
            this._config,
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
            // avoid double-connect
            await this._connected

            return
        }

        const promise = (this._connected = createControllablePromise())

        await this.crypto.initialize?.()
        await this.storage.load()

        const primaryDc = await this.storage.dcs.fetch()
        if (primaryDc !== null) this._defaultDcs = primaryDc

        const self = await this.storage.self.fetch()
        this.log.prefix = `[USER ${self?.userId ?? 'n/a'}] `

        const defaultDcAuthKey = await this.storage.provider.authKeys.get(this._defaultDcs.main.id)

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
            await this.storage.dcs.store(data.primaryDcs)

            if (data.self) {
                await this.storage.self.store(data.self)
            }

            await this.storage.provider.authKeys.set(data.primaryDcs.main.id, data.authKey)

            await this.storage.save()
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

        await this.storage.save()
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

        await this.storage.peers.updatePeersFrom(res)

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

    async notifyLoggedIn(auth: tl.auth.RawAuthorization): Promise<void> {
        this.network.notifyLoggedIn(auth)
        this.log.prefix = `[USER ${auth.user.id}] `
        await this.storage.self.store({
            userId: auth.user.id,
            isBot: auth.user._ === 'user' && auth.user.bot!,
        })
        this.emit('logged_in', auth)
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
        const primaryDcs = (await this.storage.dcs.fetch()) ?? this._defaultDcs

        const authKey = await this.storage.provider.authKeys.get(primaryDcs.main.id)
        if (!authKey) throw new Error('Auth key is not ready yet')

        return writeStringSession(this._writerMap, {
            version: 2,
            self: await this.storage.self.fetch(),
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
