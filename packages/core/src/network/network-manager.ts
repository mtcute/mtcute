import type { AsyncResourceContext, ComposedMiddleware, Middleware } from '@fuman/utils'
import type { mtp, tl } from '@mtcute/tl'
import type { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'
import type Long from 'long'
import type { StorageManager } from '../storage/storage.js'
import type { ICorePlatform } from '../types/platform.js'

import type { DcOptions, ICryptoProvider, Logger } from '../utils/index.js'
import type { ConfigManager } from './config-manager.js'
import type { SessionConnectionParams } from './session-connection.js'
import type { TelegramTransport } from './transports/abstract.js'
import { defaultReconnectionStrategy, type ReconnectionStrategy } from '@fuman/net'

import { asNonNull, composeMiddlewares, Deferred } from '@fuman/utils'
import { MtArgumentError, MtcuteError, MtUnsupportedError } from '../types/index.js'
import { assertTypeIs, isTlRpcError } from '../utils/type-assertions.js'
import { basic as defaultMiddlewares } from './middlewares/default.js'
import { MultiSessionConnection } from './multi-session-connection.js'
import { ServerSaltManager } from './server-salt.js'

export type ConnectionKind = 'main' | 'upload' | 'download' | 'downloadSmall'

/**
 * Params passed into {@link NetworkManager} by {@link TelegramClient}.
 * This type is intended for internal usage only.
 */
export interface NetworkManagerParams {
    storage: StorageManager
    crypto: ICryptoProvider
    log: Logger
    platform: ICorePlatform

    enableErrorReporting: boolean
    apiId: number
    initConnectionOptions?: Partial<Omit<tl.RawInitConnectionRequest, 'apiId' | 'query'>>
    transport: TelegramTransport
    reconnectionStrategy?: ReconnectionStrategy
    disableUpdates?: boolean
    testMode: boolean
    layer: number
    useIpv6: boolean
    readerMap: TlReaderMap
    writerMap: TlWriterMap
    isPremium: boolean
    emitError: (err: Error) => void
    onUpdate: (upd: tl.TypeUpdates, fromClient: boolean) => void
    onUsable: () => void
    onConnecting: () => void
    onNetworkChanged: (connected: boolean) => void
    stopSignal: AbortSignal
}

export type ConnectionCountDelegate = (kind: ConnectionKind, dcId: number, isPremium: boolean) => number

const defaultConnectionCountDelegate: ConnectionCountDelegate = (kind, dcId, isPremium) => {
    switch (kind) {
        case 'main':
            return 0
        case 'upload':
            return isPremium || (dcId !== 2 && dcId !== 4) ? 8 : 4
        case 'download':
            return isPremium ? 8 : 2
        case 'downloadSmall':
            return 2
    }
}

/**
 * Additional params passed into {@link NetworkManager} by the user
 * that customize the behavior of the manager
 */
export interface NetworkManagerExtraParams {
    /**
     * Whether to use PFS (Perfect Forward Secrecy) for all connections.
     * This is disabled by default
     */
    usePfs?: boolean

    /**
     * Connection count for each connection kind.
     * The function should be pure to avoid unexpected behavior.
     *
     * Defaults to TDLib logic:
     *   - main: 0 (which stands for "handle internally, based on tmp_sessions value")
     *   - upload: if premium or dc id is other than 2 or 4, then 8, otherwise 4
     *   - download: if premium then 8, otherwise 2
     *   - downloadSmall: 2
     *
     * Non-zero value for `main` is **for advanced users only**
     * as it may lead to unexpected behavior, and is generally not recommended
     * because of unnecessary extra load on both the server and the client as well as
     * increased possibility of encountering AUTH_KEY_DUPLICATED errors.
     */
    connectionCount?: ConnectionCountDelegate

    /**
     * Idle timeout for non-main connections, in ms
     *
     * @default  60000 (60 seconds).
     */
    inactivityTimeout?: number

    /**
     * List of middlewares to use for the network manager
     *
     * > **Note**: these middlewares apply to **outgoing requests only**.
     * > If you need to handle incoming updates, use a {@link Dispatcher} instead.
     */
    middlewares?: Middleware<RpcCallMiddlewareContext, unknown>[]

    /**
     * Ping interval in milliseconds.
     *
     * @default  60000 (1 minute)
     */
    pingInterval?: number
}

/** Options that can be customized when making an RPC call */
export interface RpcCallOptions {
    /**
     * If the call results in a `FLOOD_WAIT_X` error,
     * the maximum amount of time to wait before retrying.
     *
     * If set to `0`, the call will not be retried.
     *
     * Only applies when the flood waiter middleware is enabled.
     */
    floodSleepThreshold?: number

    /**
     * If the call results in an internal server error or a flood wait,
     * the maximum amount of times to retry the call.
     *
     * Only applies when the flood waiter middleware and/or
     * internal errors handler middleware is enabled.
     */
    maxRetryCount?: number

    /**
     * Timeout for the call, in milliseconds.
     *
     * @default Infinity
     */
    timeout?: number

    /**
     * **ADVANCED**
     *
     * Kind of connection to use for this call.
     *
     * @default 'main'
     */
    kind?: ConnectionKind

    /**
     * **ADVANCED**
     *
     * ID of the DC to use for this call
     */
    dcId?: number

    /**
     * **ADVANCED**
     *
     * DC connection manager to use for this call.
     * Overrides `dcId` if set.
     */
    manager?: DcConnectionManager

    /**
     * Abort signal for the call.
     */
    abortSignal?: AbortSignal

    /**
     * Whether we should not retry on -503 errors and throw {@link MtTimeoutError} immediately instead.
     *
     * Useful for methods like `messages.getBotCallbackAnswer` that reliably return
     * -503 in case the upstream bot failed to respond.
     *
     * Only applies if the internal error handler middleware is enabled,
     * otherwise -503 is always thrown.
     */
    throw503?: boolean

    /**
     * Whether the `X_MIGRATE_%d` errors should be handled locally on request level
     * instead of changing the default datacenter for the entire client.
     *
     * Useful for `invokeWithBusinessConnection`, as it returns a `USER_MIGRATE_%d` error
     * that is in fact not related to the user, but to the specific request.
     */
    localMigrate?: boolean

    /**
     * Some requests should be processed consecutively, and not in parallel.
     * Using the same `chainId` for multiple requests will ensure that they are processed in the order
     * of calling `.call()`.
     *
     * Particularly useful for `messages.sendMessage` and alike.
     */
    chainId?: string | number
}

export interface RpcCallMiddlewareContext {
    request: tl.RpcMethod
    manager: NetworkManager
    params?: RpcCallOptions
}
export type RpcCallMiddleware<Result = unknown> = Middleware<RpcCallMiddlewareContext, Result>

/**
 * Wrapper over all connection pools for a single DC.
 */
export class DcConnectionManager {
    private _salts = new ServerSaltManager()
    private _log

    /** Main connection pool */
    main: MultiSessionConnection
    /** Upload connection pool */
    upload: MultiSessionConnection
    /** Download connection pool */
    download: MultiSessionConnection
    /** Download connection pool (for small files) */
    downloadSmall: MultiSessionConnection

    private get _mainCountOverride() {
        return this.manager.params.connectionCount?.('main', this.dcId, this.manager.params.isPremium) ?? 0
    }

    constructor(
        /** Network manager instance */
        readonly manager: NetworkManager,
        /** DC ID */
        readonly dcId: number,
        /** DC options to use */
        readonly _dcs: DcOptions,
        /** Whether this DC is the primary one */
        public isPrimary = false,
    ) {
        this._log = this.manager._log.create('dc-manager')
        this._log.prefix = `[DC ${dcId}] `

        const baseConnectionParams = (): SessionConnectionParams => ({
            crypto: this.manager.params.crypto,
            initConnection: this.manager._initConnectionParams,
            transport: this.manager._transport,
            dc: this._dcs.media,
            testMode: this.manager.params.testMode,
            reconnectionStrategy: this.manager._reconnectionStrategy,
            layer: this.manager.params.layer,
            disableUpdates: this.manager.params.disableUpdates,
            readerMap: this.manager.params.readerMap,
            writerMap: this.manager.params.writerMap,
            usePfs: this.manager.params.usePfs,
            isMainConnection: false,
            isMainDcConnection: this.isPrimary,
            inactivityTimeout: this.manager.params.inactivityTimeout ?? 60_000,
            enableErrorReporting: this.manager.params.enableErrorReporting,
            salts: this._salts,
            platform: this.manager.params.platform,
            pingInterval: this.manager.params.pingInterval ?? 60_000,
        })

        const mainParams = baseConnectionParams()
        mainParams.isMainConnection = true
        mainParams.dc = _dcs.main

        if (isPrimary) {
            mainParams.inactivityTimeout = undefined
        }

        let mainCount

        if (this.isPrimary) {
            mainCount = this._mainCountOverride

            if (mainCount === 0) {
                mainCount = this.manager.config.getCached()?.tmpSessions ?? 1
            }
        } else {
            mainCount = 1
        }

        this.main = new MultiSessionConnection(mainParams, mainCount, this._log, 'MAIN')
        this.upload = new MultiSessionConnection(
            baseConnectionParams(),
            this.manager._connectionCount('upload', this.dcId, this.manager.params.isPremium),
            this._log,
            'UPLOAD',
        )
        this.download = new MultiSessionConnection(
            baseConnectionParams(),
            this.manager._connectionCount('download', this.dcId, this.manager.params.isPremium),
            this._log,
            'DOWNLOAD',
        )
        this.downloadSmall = new MultiSessionConnection(
            baseConnectionParams(),
            this.manager._connectionCount('downloadSmall', this.dcId, this.manager.params.isPremium),
            this._log,
            'DOWNLOAD_SMALL',
        )

        this._setupMulti('main')
        this._setupMulti('upload')
        this._setupMulti('download')
        this._setupMulti('downloadSmall')
    }

    private _setupMulti(kind: ConnectionKind): void {
        const connection = this[kind]

        connection.onKeyChange.add(([idx, key]) => {
            if (kind !== 'main' && key !== null) {
                // main connection is responsible for authorization,
                // and keys are then sent to other connections
                this.manager._log.warn('got key-change from non-main connection, ignoring')

                return
            }

            this.manager._log.debug('key change (empty=%b) for dc %d from connection %d', key === null, this.dcId, idx)

            // send key to other connections
            this.upload.setAuthKey(key)
            this.download.setAuthKey(key)
            this.downloadSmall.setAuthKey(key)
            Promise.resolve(this.manager._storage.provider.authKeys.set(this.dcId, key))
                .then(() => {
                    this.upload.notifyKeyChange()
                    this.download.notifyKeyChange()
                    this.downloadSmall.notifyKeyChange()
                })
                .catch((e: Error) => {
                    this.manager._log.warn('failed to save auth key for dc %d: %e', this.dcId, e)
                    this.manager.params.emitError(e)
                })
        })
        connection.onTmpKeyChange.add(([idx, key, expires]) => {
            if (kind !== 'main') {
                // tmp keys in media dcs are ephemeral so there's no point in storing them
                return
            }

            this.manager._log.debug('temp key change for dc %d from connection %d', this.dcId, idx)

            Promise.resolve(this.manager._storage.provider.authKeys.setTemp(this.dcId, idx, key, expires * 1000))
                .catch((e: Error) => {
                    this.manager._log.warn('failed to save temp auth key %d for dc %d: %e', idx, this.dcId, e)
                    this.manager.params.emitError(e)
                })
        })
        connection.onFutureSalts.add((salts: mtp.RawMt_future_salt[]) => {
            Promise.resolve(this.manager._storage.salts.store(this.dcId, salts)).catch((e: Error) =>
                this.manager.params.emitError(e),
            )
        })

        connection.onAuthBegin.add(() => {
            // we need to propagate auth-begin to all connections
            // to avoid them sending requests before auth is complete
            if (kind !== 'main') {
                this.manager._log.warn('got auth-begin from non-main connection, ignoring')

                return
            }

            // reset key on non-main connections
            // this event was already propagated to additional main connections
            this.upload.resetAuthKeys()
            this.download.resetAuthKeys()
            this.downloadSmall.resetAuthKeys()
        })

        connection.onRequestAuth.add(() => {
            this.main.requestAuth()
        })

        // fucking awesome architecture, but whatever
        connection.onRequestKeys.add((promise: Deferred<void>) => {
            this.loadKeys(true)
                .then(() => promise.resolve())
                .catch((e: Error) => promise.reject(e))
        })

        connection.onError.add((err: Error) => {
            this.manager.params.emitError(err)
        })
    }

    setIsPrimary(isPrimary: boolean): void {
        if (this.isPrimary === isPrimary) return
        this.isPrimary = isPrimary
        this.main.params.isMainDcConnection = isPrimary

        if (isPrimary) {
            this.main.setInactivityTimeout(undefined)
        } else {
            this.main.setInactivityTimeout(this.manager.params.inactivityTimeout ?? 60_000)
        }
    }

    setIsPremium(isPremium: boolean): void {
        this.upload.setCount(this.manager._connectionCount('upload', this.dcId, isPremium))
        this.download.setCount(this.manager._connectionCount('download', this.dcId, isPremium))
        this.downloadSmall.setCount(this.manager._connectionCount('downloadSmall', this.dcId, isPremium))
    }

    async loadKeys(forcePfs = false): Promise<boolean> {
        const [permanent, salts] = await Promise.all([
            this.manager._storage.provider.authKeys.get(this.dcId),
            this.manager._storage.salts.fetch(this.dcId),
        ])

        this.main.setAuthKey(permanent)
        this.upload.setAuthKey(permanent)
        this.download.setAuthKey(permanent)
        this.downloadSmall.setAuthKey(permanent)

        if (salts) {
            this._salts.setFutureSalts(salts)
        }

        if (!permanent) {
            return false
        }

        if (this.manager.params.usePfs || forcePfs) {
            const now = Date.now()
            await Promise.all(
                Array.from({ length: this.main.getCount() }, async (_, i) => {
                    const temp = await this.manager._storage.provider.authKeys.getTemp(this.dcId, i, now)
                    this.main.setTempAuthKey(temp, i)

                    // NB: we do not set temp auth keys for media connections,
                    // as they are ephemeral and dc-bound. doing this *will* lead to unwanted -404s
                }),
            )
        }

        return true
    }

    setMainConnectionCount(count: number): void {
        if (this._mainCountOverride > 0) return

        this.main.setCount(count)
    }

    async destroy(): Promise<void> {
        await this.main.destroy()
        await this.upload.destroy()
        await this.download.destroy()
        await this.downloadSmall.destroy()
        this._salts.destroy()
    }
}

/**
 * Class that manages all connections to Telegram servers.
 */
export class NetworkManager {
    readonly _log: Logger
    readonly _storage: StorageManager

    readonly _initConnectionParams: tl.RawInitConnectionRequest
    readonly _transport: TelegramTransport
    readonly _reconnectionStrategy: ReconnectionStrategy
    readonly _connectionCount: ConnectionCountDelegate

    protected readonly _dcConnections: Map<number, DcConnectionManager> = new Map()
    protected _primaryDc?: DcConnectionManager
    protected _primaryDcRecreationPromise?: Deferred<void>

    private _updateHandler: (upd: tl.TypeUpdates, fromClient: boolean) => void

    constructor(
        readonly params: NetworkManagerParams & NetworkManagerExtraParams,
        readonly config: ConfigManager,
    ) {
        const deviceModel = `mtcute on ${params.platform.getDeviceModel()}`

        this._initConnectionParams = {
            _: 'initConnection',
            deviceModel,
            systemVersion: '1.0',
            appVersion: '%VERSION%',
            systemLangCode: 'en',
            langPack: '', // "langPacks are for official apps only"
            langCode: 'en',
            ...(params.initConnectionOptions ?? {}),
            apiId: params.apiId,
            // eslint-disable-next-line
            query: null as any,
        }

        this._transport = params.transport
        this._reconnectionStrategy = params.reconnectionStrategy ?? defaultReconnectionStrategy
        this._connectionCount = params.connectionCount ?? defaultConnectionCountDelegate
        this._updateHandler = params.onUpdate

        this.call = this._composeCall(params.middlewares)

        this._onConfigChanged = this._onConfigChanged.bind(this)
        config.onUpdated.add(this._onConfigChanged)

        this._log = params.log.create('network')
        this._storage = params.storage
    }

    private async _findDcOptions(dcId: number): Promise<DcOptions> {
        const main = await this.config.findOption({
            dcId,
            allowIpv6: this.params.useIpv6,
            preferIpv6: this.params.useIpv6,
            allowMedia: false,
            cdn: false,
        })

        const media = await this.config.findOption({
            dcId,
            allowIpv6: this.params.useIpv6,
            preferIpv6: this.params.useIpv6,
            allowMedia: true,
            preferMedia: true,
            cdn: false,
        })

        if (!main || !media) {
            throw new MtArgumentError(`Could not find DC ${dcId}`)
        }

        return { main, media }
    }

    private _resetOnNetworkChange?: () => void

    private _switchPrimaryDc(dc: DcConnectionManager) {
        if (this._primaryDc && this._primaryDc !== dc) {
            this._primaryDc.setIsPrimary(false)
        }

        this._primaryDc = dc
        dc.setIsPrimary(true)

        this.params.onConnecting()

        dc.main.onUsable.add(() => {
            if (dc !== this._primaryDc) return
            this.params.onUsable()
        })
        dc.main.onWait.add(() => {
            if (dc !== this._primaryDc) return
            this.params.onConnecting()
        })
        dc.main.onUpdate.add((update: tl.TypeUpdates) => {
            this._updateHandler(update, false)
        })

        return dc.loadKeys().then(() => dc.main.ensureConnected())
    }

    private _dcCreationPromise = new Map<number, Promise<void>>()
    async _getOtherDc(dcId: number): Promise<DcConnectionManager> {
        if (!this._dcConnections.has(dcId)) {
            if (this._dcCreationPromise.has(dcId)) {
                this._log.debug('waiting for dc %d to be created', dcId)
                await this._dcCreationPromise.get(dcId)
                this._log.debug('dc %d was created', dcId)

                return asNonNull(this._dcConnections.get(dcId))
            }

            const promise = new Deferred<void>()
            this._dcCreationPromise.set(dcId, promise.promise)

            this._log.debug('creating new DC %d', dcId)

            try {
                const dcOptions = await this._findDcOptions(dcId)

                const dc = new DcConnectionManager(this, dcId, dcOptions)

                if (!(await dc.loadKeys())) {
                    dc.main.requestAuth()
                }

                this._dcConnections.set(dcId, dc)
                promise.resolve()
                this._dcCreationPromise.delete(dcId)
            } catch (e) {
                promise.reject(e)
                this._dcCreationPromise.delete(dcId)
                return this._getOtherDc(dcId)
            }
        }

        return this._dcConnections.get(dcId)!
    }

    /**
     * Perform initial connection to the default DC
     *
     * @param defaultDcs  Default DCs to connect to
     */
    async connect(defaultDcs: DcOptions): Promise<void> {
        if (defaultDcs.main.id !== defaultDcs.media.id) {
            throw new MtArgumentError('Default DCs must be the same')
        }

        if (this._dcConnections.has(defaultDcs.main.id)) {
            // shouldn't happen
            throw new MtArgumentError('DC manager already exists')
        }

        this._resetOnNetworkChange = this.params.platform.onNetworkChanged?.(this.notifyNetworkChanged.bind(this))

        const dc = new DcConnectionManager(this, defaultDcs.main.id, defaultDcs, true)
        this._dcConnections.set(defaultDcs.main.id, dc)
        await this._switchPrimaryDc(dc)
    }

    private _pendingExports = new Map<number, Promise<void>>()
    private async _exportAuthTo(manager: DcConnectionManager): Promise<void> {
        if (this._pendingExports.has(manager.dcId)) {
            this._log.debug('waiting for auth export to dc %d', manager.dcId)

            return this._pendingExports.get(manager.dcId)
        }

        this._log.debug('exporting auth to dc %d', manager.dcId)
        const promise = new Deferred<void>()
        this._pendingExports.set(manager.dcId, promise.promise)

        try {
            const auth = await this.call({
                _: 'auth.exportAuthorization',
                dcId: manager.dcId,
            })

            if (isTlRpcError(auth)) {
                throw new MtcuteError(`Failed to export (${auth.errorCode}: ${auth.errorMessage})`)
            }

            const res = await this.call(
                {
                    _: 'auth.importAuthorization',
                    id: auth.id,
                    bytes: auth.bytes,
                },
                { manager },
            )

            if (isTlRpcError(res)) {
                throw new MtcuteError(`Failed to import (${res.errorCode}: ${res.errorMessage})`)
            }

            assertTypeIs('auth.importAuthorization', res, 'auth.authorization')

            promise.resolve()
            this._pendingExports.delete(manager.dcId)
        } catch (e) {
            this._log.warn('failed to export auth to dc %d: %s', manager.dcId, e)
            promise.reject(e)
            throw e
        }
    }

    setIsPremium(isPremium: boolean): void {
        this._log.debug('setting isPremium to %s', isPremium)
        this.params.isPremium = isPremium

        for (const dc of this._dcConnections.values()) {
            dc.setIsPremium(isPremium)
        }
    }

    notifyLoggedIn(auth: tl.auth.TypeAuthorization | tl.RawUser): tl.RawUser {
        if (auth._ === 'auth.authorizationSignUpRequired') {
            throw new MtUnsupportedError(
                'Signup is no longer supported by Telegram for non-official clients. Please use your mobile device to sign up.',
            )
        }

        let user: tl.RawUser

        if (auth._ === 'auth.authorization') {
            if (auth.tmpSessions) {
                this._primaryDc?.setMainConnectionCount(auth.tmpSessions)
            }

            user = auth.user as tl.RawUser
        } else {
            if (auth.bot) {
                // bots may receive tmpSessions, which we should respect
                this.config.update(true).catch((e: Error) => this.params.emitError(e))
            }

            user = auth
        }

        this.setIsPremium(user.premium!)

        // telegram ignores invokeWithoutUpdates for auth methods
        if (auth._ === 'auth.authorization' && this.params.disableUpdates) {
            this.resetSessions()
        }

        return user
    }

    notifyLoggedOut(): void {
        this.setIsPremium(false)
        this.resetSessions()
    }

    notifyNetworkChanged(connected: boolean): void {
        this._log.debug('network changed: %s', connected ? 'connected' : 'disconnected')
        this.params.onNetworkChanged(connected)

        for (const dc of this._dcConnections.values()) {
            dc.main.notifyNetworkChanged(connected)
            dc.upload.notifyNetworkChanged(connected)
            dc.download.notifyNetworkChanged(connected)
            dc.downloadSmall.notifyNetworkChanged(connected)
        }
    }

    resetSessions(): void {
        const dc = this._primaryDc
        if (!dc) return

        dc.main.resetSessions()
        dc.upload.resetSessions()
        dc.download.resetSessions()
        dc.downloadSmall.resetSessions()
    }

    private _onConfigChanged({ current }: AsyncResourceContext<tl.RawConfig>): void {
        if (current?.tmpSessions) {
            this._primaryDc?.setMainConnectionCount(current.tmpSessions)
        }
    }

    async changePrimaryDc(newDc: number): Promise<void> {
        if (newDc === this._primaryDc?.dcId) return

        const options = await this._findDcOptions(newDc)

        if (!this._dcConnections.has(newDc)) {
            this._dcConnections.set(newDc, new DcConnectionManager(this, newDc, options, true))
        }

        await this._storage.dcs.store(options)

        await this._switchPrimaryDc(this._dcConnections.get(newDc)!)
    }

    readonly call: <T extends tl.RpcMethod>(
        message: T,
        params?: RpcCallOptions,
    ) => Promise<tl.RpcCallReturn[T['_']] | mtp.RawMt_rpc_error>

    private _composeCall = (middlewares?: Middleware<RpcCallMiddlewareContext, unknown>[]) => {
        if (!middlewares) {
            middlewares = defaultMiddlewares()
        }

        if (!middlewares.length) {
            return this._call
        }

        const final: ComposedMiddleware<RpcCallMiddlewareContext, unknown> = async (ctx) => {
            return this._call(ctx.request, ctx.params)
        }
        const composed = composeMiddlewares(middlewares, final)

        return async <T extends tl.RpcMethod>(message: T, params?: RpcCallOptions): Promise<tl.RpcCallReturn[T['_']]> =>
            composed({
                request: message,
                manager: this,
                params,
            })
    }

    private _call = async <T extends tl.RpcMethod>(
        message: T,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']] | mtp.RawMt_rpc_error> => {
        if (!this._primaryDc) {
            if (this._primaryDcRecreationPromise) {
                await this._primaryDcRecreationPromise.promise
            } else {
                throw new MtcuteError('Not connected to any DC')
            }
        }

        const kind = params?.kind ?? 'main'
        let manager: DcConnectionManager

        if (params?.manager) {
            manager = params.manager
        } else if (params?.dcId && params.dcId !== this._primaryDc!.dcId) {
            manager = await this._getOtherDc(params.dcId)
        } else {
            manager = this._primaryDc!
        }

        let multi = manager[kind]

        let res = await multi.sendRpc(message, params?.timeout, params?.abortSignal, params?.chainId)

        if (!isTlRpcError(res)) {
            // eslint-disable-next-line ts/no-unsafe-return
            return res
        }

        const err = res.errorMessage

        if (manager === this._primaryDc) {
            if (
                err.startsWith('PHONE_MIGRATE_')
                || err.startsWith('NETWORK_MIGRATE_')
                || err.startsWith('USER_MIGRATE_')
            ) {
                const newDc = Number(err.slice(err.lastIndexOf('_') + 1))

                if (Number.isNaN(newDc)) {
                    this._log.warn('invalid migrate error received: %s, ignoring', err)

                    return res
                }

                if (params?.localMigrate) {
                    manager = await this._getOtherDc(newDc)
                } else {
                    this._log.info('received %s, migrating to dc %d', err, newDc)

                    await this.changePrimaryDc(newDc)
                    manager = this._primaryDc!
                }

                multi = manager[kind]

                res = await multi.sendRpc(message, params?.timeout, params?.abortSignal, params?.chainId)
            }
        } else if (err === 'AUTH_KEY_UNREGISTERED') {
            // we can try re-exporting auth from the primary connection
            this._log.warn('exported auth key error, trying re-exporting..')

            await this._exportAuthTo(manager)

            res = await multi.sendRpc(message, params?.timeout, params?.abortSignal, params?.chainId)
        }

        // eslint-disable-next-line ts/no-unsafe-return
        return res
    }

    async changeTransport(transport: TelegramTransport): Promise<void> {
        for (const dc of this._dcConnections.values()) {
            await dc.main.changeTransport(transport)
            await dc.upload.changeTransport(transport)
            await dc.download.changeTransport(transport)
            await dc.downloadSmall.changeTransport(transport)
        }
    }

    getPoolSize(kind: ConnectionKind, dcId?: number): number {
        const dc = dcId ? this._dcConnections.get(dcId) : this._primaryDc

        if (!dc) {
            if (!this._primaryDc) {
                throw new MtcuteError('Not connected to any DC')
            }

            // guess based on the provided delegate. it is most likely correct,
            // but we should give actual values if possible
            return this._connectionCount(kind, dcId ?? this._primaryDc.dcId, this.params.isPremium)
        }

        return dc[kind].getPoolSize()
    }

    getPrimaryDcId(): number {
        if (!this._primaryDc) throw new MtcuteError('Not connected to any DC')

        return this._primaryDc.dcId
    }

    async destroy(): Promise<void> {
        for (const dc of this._dcConnections.values()) {
            await dc.destroy()
        }
        this._dcConnections.clear()
        this.config.onUpdated.remove(this._onConfigChanged)
        this._resetOnNetworkChange?.()
    }

    getMtprotoMessageId(): Long {
        return this._primaryDc!.main._connections[0]._session.getMessageId()
    }

    async recreateDc(dcId: number): Promise<void> {
        this._log.debug('recreating dc %d', dcId)
        const existing = this._dcConnections.get(dcId)
        if (existing) {
            await existing.destroy()
        }

        this._dcConnections.delete(dcId)

        if (dcId === this._primaryDc?.dcId) {
            const oldPrimaryDc = this._primaryDc
            this._primaryDc = undefined
            this._primaryDcRecreationPromise = new Deferred()

            try {
                const newDefaultDcs: DcOptions = {
                    main: asNonNull(await this.config.findOption({
                        dcId,
                        allowIpv6: this.params.useIpv6,
                    })),
                    media: asNonNull(await this.config.findOption({
                        dcId,
                        allowIpv6: this.params.useIpv6,
                        allowMedia: true,
                        preferMedia: true,
                    })),
                }

                await this._storage.dcs.store(newDefaultDcs)
                await this.connect(newDefaultDcs)
                this._primaryDcRecreationPromise.resolve()
                this._primaryDcRecreationPromise = undefined
            } catch (e) {
                // restore old primary dc to avoid a deadlock
                this._primaryDc = oldPrimaryDc
                this._primaryDcRecreationPromise?.resolve()
                this._primaryDcRecreationPromise = undefined
                throw e
            }
        }
    }
}
