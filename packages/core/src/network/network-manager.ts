import { tl } from '@mtcute/tl'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { ITelegramStorage } from '../storage'
import { ICryptoProvider, Logger, sleep } from '../utils'
import { ConfigManager } from './config-manager'
import { MultiSessionConnection } from './multi-session-connection'
import { PersistentConnectionParams } from './persistent-connection'
import {
    defaultReconnectionStrategy,
    ReconnectionStrategy,
} from './reconnection'
import {
    SessionConnection,
    SessionConnectionParams,
} from './session-connection'
import { defaultTransportFactory, TransportFactory } from './transports'

export type ConnectionKind = 'main' | 'upload' | 'download' | 'downloadSmall'

/**
 * Params passed into {@link NetworkManager} by {@link TelegramClient}.
 * This type is intended for internal usage only.
 */
export interface NetworkManagerParams {
    storage: ITelegramStorage
    crypto: ICryptoProvider
    log: Logger

    apiId: number
    initConnectionOptions?: Partial<
        Omit<tl.RawInitConnectionRequest, 'apiId' | 'query'>
    >
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
}

export type ConnectionCountDelegate = (
    kind: ConnectionKind,
    dcId: number,
    isPremium: boolean
) => number

const defaultConnectionCountDelegate: ConnectionCountDelegate = (
    kind,
    dcId,
    isPremium,
) => {
    switch (kind) {
        case 'main':
            return 1
        case 'upload':
            return isPremium || (dcId !== 2 && dcId !== 4) ? 8 : 4
        case 'download':
        case 'downloadSmall':
            return isPremium ? 8 : 2
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
     * Connection count for each connection kind
     *
     * Defaults to TDLib logic:
     *   - main: handled internally, **cannot be changed here**
     *   - upload: if premium or dc id is other than 2 or 4, then 8, otherwise 4
     *   - download: if premium then 8, otherwise 2
     *   - downloadSmall: if premium then 8, otherwise 2
     */
    connectionCount?: ConnectionCountDelegate

    /**
     * Idle timeout for non-main connections, in ms
     * Defaults to 60 seconds.
     */
    inactivityTimeout?: number
}

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
}

export class DcConnectionManager {
    private __baseConnectionParams = (): SessionConnectionParams => ({
        crypto: this.manager.params.crypto,
        initConnection: this.manager._initConnectionParams,
        transportFactory: this.manager._transportFactory,
        dc: this._dc,
        testMode: this.manager.params.testMode,
        reconnectionStrategy: this.manager._reconnectionStrategy,
        layer: this.manager.params.layer,
        disableUpdates: this.manager.params.disableUpdates,
        readerMap: this.manager.params.readerMap,
        writerMap: this.manager.params.writerMap,
        usePfs: this.manager.params.usePfs,
        isMainConnection: false,
        inactivityTimeout: this.manager.params.inactivityTimeout ?? 60_000,
    })

    private _log = this.manager._log.create('dc-manager')

    main: MultiSessionConnection

    upload = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount(
            'upload',
            this._dc.id,
            this.manager.params.isPremium,
        ),
        this._log,
        'UPLOAD',
    )

    download = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount(
            'download',
            this._dc.id,
            this.manager.params.isPremium,
        ),
        this._log,
        'DOWNLOAD',
    )

    downloadSmall = new MultiSessionConnection(
        this.__baseConnectionParams(),
        this.manager._connectionCount(
            'downloadSmall',
            this._dc.id,
            this.manager.params.isPremium,
        ),
        this._log,
        'DOWNLOAD_SMALL',
    )

    private get _mainConnectionCount() {
        if (!this.isPrimary) return 1

        return this.manager.config.getNow()?.tmpSessions ?? 1
    }

    constructor(
        readonly manager: NetworkManager,
        readonly dcId: number,
        readonly _dc: tl.RawDcOption,
        public isPrimary = false,
    ) {
        this._log.prefix = `[DC ${dcId}] `

        const mainParams = this.__baseConnectionParams()
        mainParams.isMainConnection = true

        if (isPrimary) {
            mainParams.inactivityTimeout = undefined
        }

        this.main = new MultiSessionConnection(
            mainParams,
            this._mainConnectionCount,
            this._log,
            'MAIN',
        )

        this._setupMulti('main')
        this._setupMulti('upload')
        this._setupMulti('download')
        this._setupMulti('downloadSmall')
    }

    private _setupMulti(kind: ConnectionKind): void {
        const connection = this[kind]

        connection.on('key-change', (idx, key) => {
            if (kind !== 'main') {
                // main connection is responsible for authorization,
                // and keys are then sent to other connections
                this.manager._log.warn(
                    'got key-change from non-main connection, ignoring',
                )

                return
            }

            this.manager._log.debug(
                'key change for dc %d from connection %d',
                this.dcId,
                idx,
            )
            this.manager._storage.setAuthKeyFor(this.dcId, key)

            // send key to other connections
            Promise.all([
                this.upload.setAuthKey(key),
                this.download.setAuthKey(key),
                this.downloadSmall.setAuthKey(key),
            ]).then(() => {
                this.upload.notifyKeyChange()
                this.download.notifyKeyChange()
                this.downloadSmall.notifyKeyChange()
            })
        })
        connection.on('tmp-key-change', (idx, key, expires) => {
            if (kind !== 'main') {
                this.manager._log.warn(
                    'got tmp-key-change from non-main connection, ignoring',
                )

                return
            }

            this.manager._log.debug(
                'temp key change for dc %d from connection %d',
                this.dcId,
                idx,
            )
            this.manager._storage.setTempAuthKeyFor(
                this.dcId,
                idx,
                key,
                expires * 1000,
            )

            // send key to other connections
            Promise.all([
                this.upload.setAuthKey(key, true),
                this.download.setAuthKey(key, true),
                this.downloadSmall.setAuthKey(key, true),
            ]).then(() => {
                this.upload.notifyKeyChange()
                this.download.notifyKeyChange()
                this.downloadSmall.notifyKeyChange()
            })
        })

        connection.on('auth-begin', () => {
            // we need to propagate auth-begin to all connections
            // to avoid them sending requests before auth is complete
            if (kind !== 'main') {
                this.manager._log.warn(
                    'got auth-begin from non-main connection, ignoring',
                )

                return
            }

            // reset key on non-main connections
            // this event was already propagated to additional main connections
            // todo
        })

        connection.on('request-auth', () => {
            this.main.requestAuth()
        })
    }

    setIsPrimary(isPrimary: boolean): void {
        if (this.isPrimary === isPrimary) return
        this.isPrimary = isPrimary

        if (isPrimary) {
            this.main.setInactivityTimeout(undefined)
        } else {
            this.main.setInactivityTimeout(
                this.manager.params.inactivityTimeout ?? 60_000,
            )
        }
    }

    async loadKeys(): Promise<boolean> {
        const permanent = await this.manager._storage.getAuthKeyFor(this.dcId)

        await Promise.all([
            this.main.setAuthKey(permanent),
            this.upload.setAuthKey(permanent),
            this.download.setAuthKey(permanent),
            this.downloadSmall.setAuthKey(permanent),
        ])

        if (!permanent) {
            return false
        }

        if (this.manager.params.usePfs) {
            await Promise.all(
                this.main._sessions.map(async (_, i) => {
                    const temp = await this.manager._storage.getAuthKeyFor(
                        this.dcId,
                        i,
                    )
                    await this.main.setAuthKey(temp, true, i)

                    if (i === 0) {
                        await Promise.all([
                            this.upload.setAuthKey(temp, true),
                            this.download.setAuthKey(temp, true),
                            this.downloadSmall.setAuthKey(temp, true),
                        ])
                    }
                }),
            )
        }

        return true
    }
}

export class NetworkManager {
    readonly _log = this.params.log.create('network')
    readonly _storage = this.params.storage

    readonly _initConnectionParams: tl.RawInitConnectionRequest
    readonly _transportFactory: TransportFactory
    readonly _reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>
    readonly _connectionCount: ConnectionCountDelegate

    protected readonly _dcConnections: Record<number, DcConnectionManager> = {}
    protected _primaryDc?: DcConnectionManager

    private _keepAliveInterval?: NodeJS.Timeout
    private _keepAliveAction = this._defaultKeepAliveAction.bind(this)
    private _lastUpdateTime = 0
    private _updateHandler: (upd: tl.TypeUpdates) => void = () => {}

    private _defaultKeepAliveAction(): void {
        if (this._keepAliveInterval) return

        // todo
        // telegram asks to fetch pending updates
        // if there are no updates for 15 minutes.
        // core does not have update handling,
        // so we just use getState so the server knows
        // we still do need updates
        // this.call({ _: 'updates.getState' }).catch((e) => {
        //     if (!(e instanceof tl.errors.RpcError)) {
        //         this.primaryConnection.reconnect()
        //     }
        // })
    }

    constructor(
        readonly params: NetworkManagerParams & NetworkManagerExtraParams,
        readonly config: ConfigManager,
    ) {
        let deviceModel = 'mtcute on '
        let appVersion = 'unknown'
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const os = require('os')
            deviceModel += `${os.type()} ${os.arch()} ${os.release()}`

            try {
                // for production builds
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                appVersion = require('../package.json').version
            } catch (e) {
                try {
                    // for development builds (additional /src/ in path)
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    appVersion = require('../../package.json').version
                } catch (e) {}
            }
        } else if (typeof navigator !== 'undefined') {
            deviceModel += navigator.userAgent
        } else deviceModel += 'unknown'

        this._initConnectionParams = {
            _: 'initConnection',
            deviceModel,
            systemVersion: '1.0',
            appVersion,
            systemLangCode: 'en',
            langPack: '', // "langPacks are for official apps only"
            langCode: 'en',
            ...(params.initConnectionOptions ?? {}),
            apiId: params.apiId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query: null as any,
        }

        this._transportFactory = params.transport ?? defaultTransportFactory
        this._reconnectionStrategy =
            params.reconnectionStrategy ?? defaultReconnectionStrategy
        this._connectionCount =
            params.connectionCount ?? defaultConnectionCountDelegate

        this._onConfigChanged = this._onConfigChanged.bind(this)
        config.onConfigUpdate(this._onConfigChanged)
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
            this._keepAliveInterval = setInterval(async () => {
                if (Date.now() - this._lastUpdateTime > 900_000) {
                    this._keepAliveAction()
                    this._lastUpdateTime = Date.now()
                }
            }, 60_000)

            Promise.resolve(this._storage.getSelf()).then((self) => {
                if (self?.isBot) {
                    // bots may receive tmpSessions, which we should respect
                    this.config
                        .update(true)
                        .catch((e) => this.params._emitError(e))
                }
            })
        })
        dc.main.on('update', (update) => {
            this._lastUpdateTime = Date.now()
            this._updateHandler(update)
        })
        // dc.mainConnection.on('wait', () =>
        //     this._cleanupPrimaryConnection()
        // )

        dc.main.on('error', (err, conn) => this.params._emitError(err, conn))

        dc.loadKeys()
            .catch((e) => this.params._emitError(e))
            .then(() => dc.main.ensureConnected())
    }

    async _getOtherDc(dcId: number): Promise<DcConnectionManager> {
        if (!this._dcConnections[dcId]) {
            this._log.debug('creating new DC %d', dcId)

            const dcOption = await this.config.findOption({
                dcId,
                allowIpv6: this.params.useIpv6,
                preferIpv6: this.params.useIpv6,
                preferMedia: dcId !== this._primaryDc?.dcId,
                cdn: false,
            })

            if (!dcOption) {
                throw new Error(`Could not find DC ${dcId}`)
            }
            const dc = new DcConnectionManager(this, dcId, dcOption)

            if (!(await dc.loadKeys())) {
                dc.main.requestAuth()
            }

            this._dcConnections[dcId] = dc
        }

        return this._dcConnections[dcId]
    }

    /**
     * Perform initial connection to the default DC
     *
     * @param defaultDc  Default DC to connect to
     */
    async connect(defaultDc: tl.RawDcOption): Promise<void> {
        if (this._dcConnections[defaultDc.id]) {
            // shouldn't happen
            throw new Error('DC manager already exists')
        }

        const dc = new DcConnectionManager(this, defaultDc.id, defaultDc)
        this._dcConnections[defaultDc.id] = dc
        await this._switchPrimaryDc(dc)
    }

    private async _exportAuthTo(manager: DcConnectionManager): Promise<void> {
        const auth = await this.call({
            _: 'auth.exportAuthorization',
            dcId: manager.dcId,
        })

        // manager.ensureMainConnection()
        //
        // if (!manager.main._sessions[0]._authKey.ready) {
        //     await manager.loadKeys()
        // }
        //
        // manager.main.ensureConnected()

        const res = await this.call(
            {
                _: 'auth.importAuthorization',
                id: auth.id,
                bytes: auth.bytes,
            },
            { manager },
        )

        if (res._ !== 'auth.authorization') {
            throw new Error(
                `Unexpected response from auth.importAuthorization: ${res._}`,
            )
        }
    }

    async exportAuth(): Promise<void> {
        const dcs: Record<number, number> = {}
        const config = await this.config.get()

        for (const dc of config.dcOptions) {
            if (dc.cdn) continue
            dcs[dc.id] = dc.id
        }

        for (const dc of Object.values(dcs)) {
            if (dc === this._primaryDc!.dcId) continue
            this._log.debug('exporting auth for dc %d', dc)

            const manager = await this._getOtherDc(dc)
            await this._exportAuthTo(manager)
        }
    }

    async notifyLoggedIn(auth: tl.auth.TypeAuthorization): Promise<void> {
        if (auth._ === 'auth.authorizationSignUpRequired') return

        if (auth.tmpSessions) {
            this._primaryDc?.main.setCount(auth.tmpSessions)
        }

        // await this.exportAuth()
    }

    private _onConfigChanged(config: tl.RawConfig): void {
        if (config.tmpSessions) {
            this._primaryDc?.main.setCount(config.tmpSessions)
        }
    }

    async changePrimaryDc(newDc: number): Promise<void> {
        if (newDc === this._primaryDc?.dcId) return

        const option = await this.config.findOption({
            dcId: newDc,
            allowIpv6: this.params.useIpv6,
            preferIpv6: this.params.useIpv6,
            cdn: false,
        })

        if (!option) {
            throw new Error(`DC ${newDc} not found`)
        }

        if (!this._dcConnections[newDc]) {
            this._dcConnections[newDc] = new DcConnectionManager(
                this,
                newDc,
                option,
            )
        }

        this._storage.setDefaultDc(option)

        this._switchPrimaryDc(this._dcConnections[newDc])
    }

    private _floodWaitedRequests: Record<string, number> = {}
    async call<T extends tl.RpcMethod>(
        message: T,
        params?: RpcCallOptions,
        stack?: string,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (!this._primaryDc) {
            throw new Error('Not connected to any DC')
        }

        const floodSleepThreshold =
            params?.floodSleepThreshold ?? this.params.floodSleepThreshold
        const maxRetryCount = params?.maxRetryCount ?? this.params.maxRetryCount

        // do not send requests that are in flood wait
        if (message._ in this._floodWaitedRequests) {
            const delta = this._floodWaitedRequests[message._] - Date.now()

            if (delta <= 3000) {
                // flood waits below 3 seconds are "ignored"
                delete this._floodWaitedRequests[message._]
            } else if (delta <= this.params.floodSleepThreshold) {
                await sleep(delta)
                delete this._floodWaitedRequests[message._]
            } else {
                throw new tl.errors.FloodWaitXError(delta / 1000)
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
                const res = await multi.sendRpc(message, stack, params?.timeout)

                if (kind === 'main') {
                    this._lastUpdateTime = Date.now()
                }

                return res
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                lastError = e

                if (e instanceof tl.errors.InternalError) {
                    this._log.warn('Telegram is having internal issues: %s', e)

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
                        (e as tl.Mutable<typeof e>).seconds = 1
                    }

                    if (e.seconds <= floodSleepThreshold) {
                        this._log.info('Flood wait for %d seconds', e.seconds)
                        await sleep(e.seconds * 1000)
                        continue
                    }
                }

                if (manager === this._primaryDc) {
                    if (
                        e.constructor === tl.errors.PhoneMigrateXError ||
                        e.constructor === tl.errors.UserMigrateXError ||
                        e.constructor === tl.errors.NetworkMigrateXError
                    ) {
                        this._log.info('Migrate error, new dc = %d', e.new_dc)

                        await this.changePrimaryDc(e.new_dc)
                        manager = this._primaryDc!
                        multi = manager[kind]

                        continue
                    }
                } else if (
                    e.constructor === tl.errors.AuthKeyUnregisteredError
                ) {
                    // we can try re-exporting auth from the primary connection
                    this._log.warn(
                        'exported auth key error, trying re-exporting..',
                    )

                    await this._exportAuthTo(manager)
                    continue
                }

                throw e
            }
        }

        throw lastError
    }

    destroy(): void {
        for (const dc of Object.values(this._dcConnections)) {
            dc.main.destroy()
            dc.upload.destroy()
            dc.download.destroy()
            dc.downloadSmall.destroy()
        }
        if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
        this.config.offConfigUpdate(this._onConfigChanged)
    }
}
