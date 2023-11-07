import { tl } from '@mtcute/tl'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { ITelegramStorage } from '../storage/index.js'
import { MtArgumentError, MtcuteError } from '../types/index.js'
import { createControllablePromise, ICryptoProvider, Logger, sleep } from '../utils/index.js'
import { assertTypeIs } from '../utils/type-assertions.js'
import { ConfigManager } from './config-manager.js'
import { MultiSessionConnection } from './multi-session-connection.js'
import { PersistentConnectionParams } from './persistent-connection.js'
import { defaultReconnectionStrategy, ReconnectionStrategy } from './reconnection.js'
import { SessionConnection, SessionConnectionParams } from './session-connection.js'
import { defaultTransportFactory, TransportFactory } from './transports/index.js'

export type ConnectionKind = 'main' | 'upload' | 'download' | 'downloadSmall'

const CLIENT_ERRORS = {
    [tl.RpcError.BAD_REQUEST]: 1,
    [tl.RpcError.UNAUTHORIZED]: 1,
    [tl.RpcError.FORBIDDEN]: 1,
    [tl.RpcError.NOT_FOUND]: 1,
    [tl.RpcError.FLOOD]: 1,
    [tl.RpcError.SEE_OTHER]: 1,
    [tl.RpcError.NOT_ACCEPTABLE]: 1,
}

/**
 * Params passed into {@link NetworkManager} by {@link TelegramClient}.
 * This type is intended for internal usage only.
 */
export interface NetworkManagerParams {
    storage: ITelegramStorage
    crypto: ICryptoProvider
    log: Logger

    enableErrorReporting: boolean
    apiId: number
    initConnectionOptions?: Partial<Omit<tl.RawInitConnectionRequest, 'apiId' | 'query'>>
    transport?: TransportFactory
    reconnectionStrategy?: ReconnectionStrategy<PersistentConnectionParams>
    floodSleepThreshold: number
    maxRetryCount: number
    disableUpdates?: boolean
    testMode: boolean
    layer: number
    useIpv6: boolean
    readerMap: TlReaderMap
    writerMap: TlWriterMap
    isPremium: boolean
    _emitError: (err: Error, connection?: SessionConnection) => void
    keepAliveAction: () => void
}

export type ConnectionCountDelegate = (kind: ConnectionKind, dcId: number, isPremium: boolean) => number

const defaultConnectionCountDelegate: ConnectionCountDelegate = (kind, dcId, isPremium) => {
    switch (kind) {
        case 'main':
            return 1
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
     *   - main: handled internally, **cannot be changed here**
     *   - upload: if premium or dc id is other than 2 or 4, then 8, otherwise 4
     *   - download: if premium then 8, otherwise 2
     *   - downloadSmall: 2
     */
    connectionCount?: ConnectionCountDelegate

    /**
     * Idle timeout for non-main connections, in ms
     *
     * @default  60000 (60 seconds).
     */
    inactivityTimeout?: number
}

/** Options that can be customized when making an RPC call */
export interface RpcCallOptions {
    /**
     * If the call results in a `FLOOD_WAIT_X` error,
     * the maximum amount of time to wait before retrying.
     *
     * If set to `0`, the call will not be retried.
     *
     * @default {@link BaseTelegramClientOptions.floodSleepThreshold}
     */
    floodSleepThreshold?: number

    /**
     * If the call results in an internal server error or a flood wait,
     * the maximum amount of times to retry the call.
     *
     * @default {@link BaseTelegramClientOptions.maxRetryCount}
     */
    maxRetryCount?: number

    /**
     * Timeout for the call, in milliseconds.
     *
     * @default Infinity
     */
    timeout?: number

    /**
     * Kind of connection to use for this call.
     *
     * @default 'main'
     */
    kind?: ConnectionKind

    /**
     * ID of the DC to use for this call
     */
    dcId?: number

    /**
     * DC connection manager to use for this call.
     * Overrides `dcId` if set.
     */
    manager?: DcConnectionManager

    /**
     * Abort signal for the call.
     */
    abortSignal?: AbortSignal
}

/**
 * Wrapper over all connection pools for a single DC.
 */
export class DcConnectionManager {
    private __baseConnectionParams = (): SessionConnectionParams => ({
        crypto: this.manager.params.crypto,
        initConnection: this.manager._initConnectionParams,
        transportFactory: this.manager._transportFactory,
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
    })

    private _log = this.manager._log.create('dc-manager')

    /** Main connection pool */
    main: MultiSessionConnection

    /** Upload connection pool */
    upload = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount('upload', this.dcId, this.manager.params.isPremium),
        this._log,
        'UPLOAD',
    )

    /** Download connection pool */
    download = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount('download', this.dcId, this.manager.params.isPremium),
        this._log,
        'DOWNLOAD',
    )

    /** Download connection pool (for small files) */
    downloadSmall = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount('downloadSmall', this.dcId, this.manager.params.isPremium),
        this._log,
        'DOWNLOAD_SMALL',
    )

    private get _mainConnectionCount() {
        if (!this.isPrimary) return 1

        return this.manager.config.getNow()?.tmpSessions ?? 1
    }

    constructor(
        /** Network manager instance */
        readonly manager: NetworkManager,
        /** DC ID */
        readonly dcId: number,
        /** DC options to use */
        readonly _dcs: ITelegramStorage.DcOptions,
        /** Whether this DC is the primary one */
        public isPrimary = false,
    ) {
        this._log.prefix = `[DC ${dcId}] `

        const mainParams = this.__baseConnectionParams()
        mainParams.isMainConnection = true
        mainParams.dc = _dcs.main

        if (isPrimary) {
            mainParams.inactivityTimeout = undefined
        }

        this.main = new MultiSessionConnection(mainParams, this._mainConnectionCount, this._log, 'MAIN')

        this._setupMulti('main')
        this._setupMulti('upload')
        this._setupMulti('download')
        this._setupMulti('downloadSmall')
    }

    private _setupMulti(kind: ConnectionKind): void {
        const connection = this[kind]

        connection.on('key-change', (idx, key: Uint8Array | null) => {
            if (kind !== 'main') {
                // main connection is responsible for authorization,
                // and keys are then sent to other connections
                this.manager._log.warn('got key-change from non-main connection, ignoring')

                return
            }

            this.manager._log.debug('key change for dc %d from connection %d', this.dcId, idx)

            // send key to other connections
            Promise.all([
                this.manager._storage.setAuthKeyFor(this.dcId, key),
                this.upload.setAuthKey(key),
                this.download.setAuthKey(key),
                this.downloadSmall.setAuthKey(key),
            ])
                .then(() => {
                    this.upload.notifyKeyChange()
                    this.download.notifyKeyChange()
                    this.downloadSmall.notifyKeyChange()
                })
                .catch((e: Error) => this.manager.params._emitError(e))
        })
        connection.on('tmp-key-change', (idx: number, key: Uint8Array | null, expires: number) => {
            if (kind !== 'main') {
                this.manager._log.warn('got tmp-key-change from non-main connection, ignoring')

                return
            }

            this.manager._log.debug('temp key change for dc %d from connection %d', this.dcId, idx)

            // send key to other connections
            Promise.all([
                this.manager._storage.setTempAuthKeyFor(this.dcId, idx, key, expires * 1000),
                this.upload.setAuthKey(key, true),
                this.download.setAuthKey(key, true),
                this.downloadSmall.setAuthKey(key, true),
            ])
                .then(() => {
                    this.upload.notifyKeyChange()
                    this.download.notifyKeyChange()
                    this.downloadSmall.notifyKeyChange()
                })
                .catch((e: Error) => this.manager.params._emitError(e))
        })

        connection.on('auth-begin', () => {
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

        connection.on('request-auth', () => {
            this.main.requestAuth()
        })

        connection.on('error', (err: Error, conn: SessionConnection) => {
            this.manager.params._emitError(err, conn)
        })
    }

    setIsPrimary(isPrimary: boolean): void {
        if (this.isPrimary === isPrimary) return
        this.isPrimary = isPrimary

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

    async loadKeys(): Promise<boolean> {
        const permanent = await this.manager._storage.getAuthKeyFor(this.dcId)

        this.main.setAuthKey(permanent)
        this.upload.setAuthKey(permanent)
        this.download.setAuthKey(permanent)
        this.downloadSmall.setAuthKey(permanent)

        if (!permanent) {
            return false
        }

        if (this.manager.params.usePfs) {
            await Promise.all(
                this.main._sessions.map(async (_, i) => {
                    const temp = await this.manager._storage.getAuthKeyFor(this.dcId, i)
                    this.main.setAuthKey(temp, true, i)

                    if (i === 0) {
                        this.upload.setAuthKey(temp, true)
                        this.download.setAuthKey(temp, true)
                        this.downloadSmall.setAuthKey(temp, true)
                    }
                }),
            )
        }

        return true
    }
}

/**
 * Class that manages all connections to Telegram servers.
 */
export class NetworkManager {
    readonly _log = this.params.log.create('network')
    readonly _storage = this.params.storage

    readonly _initConnectionParams: tl.RawInitConnectionRequest
    readonly _transportFactory: TransportFactory
    readonly _reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>
    readonly _connectionCount: ConnectionCountDelegate

    protected readonly _dcConnections = new Map<number, DcConnectionManager>()
    protected _primaryDc?: DcConnectionManager

    private _keepAliveInterval?: NodeJS.Timeout
    private _lastUpdateTime = 0
    private _updateHandler: (upd: tl.TypeUpdates, fromClient: boolean) => void = () => {}

    constructor(
        readonly params: NetworkManagerParams & NetworkManagerExtraParams,
        readonly config: ConfigManager,
    ) {
        let deviceModel = 'mtcute on '
        /* eslint-disable no-restricted-globals */
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            const os = require('os') as typeof import('os')
            deviceModel += `${os.type()} ${os.arch()} ${os.release()}`
            /* eslint-enable no-restricted-globals */
        } else if (typeof navigator !== 'undefined') {
            deviceModel += navigator.userAgent
        } else deviceModel += 'unknown'

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

        this._transportFactory = params.transport ?? defaultTransportFactory
        this._reconnectionStrategy = params.reconnectionStrategy ?? defaultReconnectionStrategy
        this._connectionCount = params.connectionCount ?? defaultConnectionCountDelegate

        this._onConfigChanged = this._onConfigChanged.bind(this)
        config.onConfigUpdate(this._onConfigChanged)
    }

    private async _findDcOptions(dcId: number): Promise<ITelegramStorage.DcOptions> {
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

    private _switchPrimaryDc(dc: DcConnectionManager) {
        if (this._primaryDc && this._primaryDc !== dc) {
            this._primaryDc.setIsPrimary(false)
        }

        this._primaryDc = dc
        dc.setIsPrimary(true)

        dc.main.on('usable', () => {
            this._lastUpdateTime = Date.now()

            if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
            this._keepAliveInterval = setInterval(() => {
                if (Date.now() - this._lastUpdateTime > 900_000) {
                    // telegram asks to fetch pending updates if there are no updates for 15 minutes.
                    // it is up to the user to decide whether to do it or not

                    this.params.keepAliveAction()
                    this._lastUpdateTime = Date.now()
                }
            }, 60_000)

            Promise.resolve(this._storage.getSelf())
                .then((self) => {
                    if (self?.isBot) {
                        // bots may receive tmpSessions, which we should respect
                        return this.config.update(true)
                    }
                })
                .catch((e: Error) => this.params._emitError(e))
        })
        dc.main.on('update', (update: tl.TypeUpdates) => {
            this._lastUpdateTime = Date.now()
            this._updateHandler(update, false)
        })

        return dc.loadKeys().then(() => dc.main.ensureConnected())
    }

    private _dcCreationPromise = new Map<number, Promise<void>>()
    async _getOtherDc(dcId: number): Promise<DcConnectionManager> {
        if (!this._dcConnections.has(dcId)) {
            if (this._dcCreationPromise.has(dcId)) {
                this._log.debug('waiting for DC %d to be created', dcId)
                await this._dcCreationPromise.get(dcId)

                return this._dcConnections.get(dcId)!
            }

            const promise = createControllablePromise<void>()
            this._dcCreationPromise.set(dcId, promise)

            this._log.debug('creating new DC %d', dcId)

            try {
                const dcOptions = await this._findDcOptions(dcId)

                const dc = new DcConnectionManager(this, dcId, dcOptions)

                if (!(await dc.loadKeys())) {
                    dc.main.requestAuth()
                }

                this._dcConnections.set(dcId, dc)
                promise.resolve()
            } catch (e) {
                promise.reject(e)
            }
        }

        return this._dcConnections.get(dcId)!
    }

    /**
     * Perform initial connection to the default DC
     *
     * @param defaultDcs  Default DCs to connect to
     */
    async connect(defaultDcs: ITelegramStorage.DcOptions): Promise<void> {
        if (defaultDcs.main.id !== defaultDcs.media.id) {
            throw new MtArgumentError('Default DCs must be the same')
        }

        if (this._dcConnections.has(defaultDcs.main.id)) {
            // shouldn't happen
            throw new MtArgumentError('DC manager already exists')
        }

        const dc = new DcConnectionManager(this, defaultDcs.main.id, defaultDcs)
        this._dcConnections.set(defaultDcs.main.id, dc)
        await this._switchPrimaryDc(dc)
    }

    private _pendingExports: Record<number, Promise<void>> = {}
    private async _exportAuthTo(manager: DcConnectionManager): Promise<void> {
        if (manager.dcId in this._pendingExports) {
            this._log.debug('waiting for auth export to dc %d', manager.dcId)

            return this._pendingExports[manager.dcId]
        }

        this._log.debug('exporting auth to dc %d', manager.dcId)
        const promise = createControllablePromise<void>()
        this._pendingExports[manager.dcId] = promise

        try {
            const auth = await this.call({
                _: 'auth.exportAuthorization',
                dcId: manager.dcId,
            })

            const res = await this.call(
                {
                    _: 'auth.importAuthorization',
                    id: auth.id,
                    bytes: auth.bytes,
                },
                { manager },
            )

            assertTypeIs('auth.importAuthorization', res, 'auth.authorization')

            promise.resolve()
            delete this._pendingExports[manager.dcId]
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

    notifyLoggedIn(auth: tl.auth.TypeAuthorization): void {
        if (auth._ === 'auth.authorizationSignUpRequired' || auth.user._ === 'userEmpty') {
            return
        }

        if (auth.tmpSessions) {
            this._primaryDc?.main.setCount(auth.tmpSessions)
        }

        this.setIsPremium(auth.user.premium!)
    }

    resetSessions(): void {
        const dc = this._primaryDc
        if (!dc) return

        dc.main.resetSessions()
        dc.upload.resetSessions()
        dc.download.resetSessions()
        dc.downloadSmall.resetSessions()
    }

    private _onConfigChanged(config: tl.RawConfig): void {
        if (config.tmpSessions) {
            this._primaryDc?.main.setCount(config.tmpSessions)
        }
    }

    async changePrimaryDc(newDc: number): Promise<void> {
        if (newDc === this._primaryDc?.dcId) return

        const options = await this._findDcOptions(newDc)

        if (!this._dcConnections.has(newDc)) {
            this._dcConnections.set(newDc, new DcConnectionManager(this, newDc, options))
        }

        await this._storage.setDefaultDcs(options)

        await this._switchPrimaryDc(this._dcConnections.get(newDc)!)
    }

    private _floodWaitedRequests = new Map<string, number>()
    async call<T extends tl.RpcMethod>(
        message: T,
        params?: RpcCallOptions,
        stack?: string,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (!this._primaryDc) {
            throw new MtcuteError('Not connected to any DC')
        }

        const floodSleepThreshold = params?.floodSleepThreshold ?? this.params.floodSleepThreshold
        const maxRetryCount = params?.maxRetryCount ?? this.params.maxRetryCount

        // do not send requests that are in flood wait
        if (this._floodWaitedRequests.has(message._)) {
            const delta = this._floodWaitedRequests.get(message._)! - Date.now()

            if (delta <= 3000) {
                // flood waits below 3 seconds are "ignored"
                this._floodWaitedRequests.delete(message._)
            } else if (delta <= this.params.floodSleepThreshold) {
                await sleep(delta)
                this._floodWaitedRequests.delete(message._)
            } else {
                const err = tl.RpcError.create(tl.RpcError.FLOOD, 'FLOOD_WAIT_%d')
                err.seconds = Math.ceil(delta / 1000)
                throw err
            }
        }

        let lastError: Error | null = null

        const kind = params?.kind ?? 'main'
        let manager: DcConnectionManager

        if (params?.manager) {
            manager = params.manager
        } else if (params?.dcId && params.dcId !== this._primaryDc.dcId) {
            manager = await this._getOtherDc(params.dcId)
        } else {
            manager = this._primaryDc
        }

        let multi = manager[kind]

        for (let i = 0; i < maxRetryCount; i++) {
            try {
                const res = await multi.sendRpc(message, stack, params?.timeout, params?.abortSignal)

                if (kind === 'main') {
                    this._lastUpdateTime = Date.now()
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return res
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                lastError = e as Error

                if (!tl.RpcError.is(e)) continue

                if (!(e.code in CLIENT_ERRORS)) {
                    this._log.warn('Telegram is having internal issues: %d %s, retrying', e.code, e.message)

                    if (e.text === 'WORKER_BUSY_TOO_LONG_RETRY') {
                        // according to tdlib, "it is dangerous to resend query without timeout, so use 1"
                        await sleep(1000)
                    }
                    continue
                }

                if (e.is('FLOOD_WAIT_%d') || e.is('SLOWMODE_WAIT_%d') || e.is('FLOOD_TEST_PHONE_WAIT_%d')) {
                    if (e.text !== 'SLOWMODE_WAIT_%d') {
                        // SLOW_MODE_WAIT is chat-specific, not request-specific
                        this._floodWaitedRequests.set(message._, Date.now() + e.seconds * 1000)
                    }

                    // In test servers, FLOOD_WAIT_0 has been observed, and sleeping for
                    // such a short amount will cause retries very fast leading to issues
                    if (e.seconds === 0) {
                        e.seconds = 1
                    }

                    if (e.seconds <= floodSleepThreshold) {
                        this._log.info('Flood wait for %d seconds', e.seconds)
                        await sleep(e.seconds * 1000)
                        continue
                    }
                }

                if (manager === this._primaryDc) {
                    if (e.is('PHONE_MIGRATE_%d') || e.is('NETWORK_MIGRATE_%d') || e.is('USER_MIGRATE_%d')) {
                        this._log.info('Migrate error, new dc = %d', e.newDc)

                        await this.changePrimaryDc(e.newDc)
                        manager = this._primaryDc!
                        multi = manager[kind]

                        continue
                    }
                } else if (e.is('AUTH_KEY_UNREGISTERED')) {
                    // we can try re-exporting auth from the primary connection
                    this._log.warn('exported auth key error, trying re-exporting..')

                    await this._exportAuthTo(manager)
                    continue
                }

                throw e
            }
        }

        throw lastError!
    }

    setUpdateHandler(handler: (upd: tl.TypeUpdates, fromClient: boolean) => void): void {
        this._updateHandler = handler
    }

    handleUpdate(update: tl.TypeUpdates, fromClient = true): void {
        this._updateHandler(update, fromClient)
    }

    changeTransport(factory: TransportFactory): void {
        for (const dc of this._dcConnections.values()) {
            dc.main.changeTransport(factory)
            dc.upload.changeTransport(factory)
            dc.download.changeTransport(factory)
            dc.downloadSmall.changeTransport(factory)
        }
    }

    getPoolSize(kind: ConnectionKind, dcId?: number) {
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

    getPrimaryDcId() {
        if (!this._primaryDc) throw new MtcuteError('Not connected to any DC')

        return this._primaryDc.dcId
    }

    destroy(): void {
        for (const dc of this._dcConnections.values()) {
            dc.main.destroy()
            dc.upload.destroy()
            dc.download.destroy()
            dc.downloadSmall.destroy()
        }
        if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
        this.config.offConfigUpdate(this._onConfigChanged)
    }
}
