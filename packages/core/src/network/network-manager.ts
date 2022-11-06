import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'
import { tl } from '@mtcute/tl'

import { createControllablePromise, ICryptoProvider, Logger } from '../utils'
import { defaultTransportFactory, TransportFactory } from './transports'
import {
    defaultReconnectionStrategy,
    ReconnectionStrategy,
} from './reconnection'
import { PersistentConnectionParams } from './persistent-connection'
import { ConfigManager } from './config-manager'
import { MultiSessionConnection } from './multi-session-connection'
import { SessionConnectionParams } from './session-connection'
import { ITelegramStorage } from '../storage'

export class DcConnectionManager {
    constructor(
        readonly manager: NetworkManager,
        readonly dcId: number,
        private _dc: tl.RawDcOption
    ) {}

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
    })

    mainConnection = new MultiSessionConnection(
        {
            ...this.__baseConnectionParams(),
            isMainConnection: true,
        },
        1,
        this.manager._log
    )
}

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

    disableUpdates?: boolean
    testMode: boolean
    layer: number
    readerMap: TlReaderMap
    writerMap: TlWriterMap
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
}

export class NetworkManager {
    readonly _log = this.params.log.create('network')

    readonly _initConnectionParams: tl.RawInitConnectionRequest
    readonly _transportFactory: TransportFactory
    readonly _reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>

    protected readonly _dcConnections: Record<number, DcConnectionManager> = {}
    protected _primaryDc?: DcConnectionManager

    private _keepAliveInterval?: NodeJS.Timeout
    private _keepAliveAction = this._defaultKeepAliveAction.bind(this)

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
        readonly config: ConfigManager
    ) {
        let deviceModel = 'mtcute on '
        let appVersion = 'unknown'
        if (typeof process !== 'undefined' && typeof require !== 'undefined') {
            const os = require('os')
            deviceModel += `${os.type()} ${os.arch()} ${os.release()}`
            try {
                // for production builds
                appVersion = require('../package.json').version
            } catch (e) {
                try {
                    // for development builds (additional /src/ in path)
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
            query: null as any,
        }

        this._transportFactory = params.transport ?? defaultTransportFactory
        this._reconnectionStrategy =
            params.reconnectionStrategy ?? defaultReconnectionStrategy

        // this._dcConnections[params.defaultDc?.id ?? 2] =
        //     new DcConnectionManager(this, params.defaultDc?.id ?? 2)
    }

    private _switchPrimaryDc(dc: DcConnectionManager) {
        if (this._primaryDc && this._primaryDc !== dc) {
            // todo clean up
            return
        }

        this._primaryDc = dc

        // todo add handlers
        /*
        this.primaryConnection.on('usable', () => {
            this._lastUpdateTime = Date.now()

            if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
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
            this.storage.setAuthKeyFor(this._defaultDc.id, key)
            await this._saveStorage()
        })
        this.primaryConnection.on('error', (err) =>
            this._emitError(err, this.primaryConnection)
        )
         */
        dc.mainConnection.connect()
    }

    /**
     * Perform initial connection to the default DC
     *
     * @param defaultDc  Default DC to connect to
     */
    connect(defaultDc: tl.RawDcOption): void {
        if (this._dcConnections[defaultDc.id]) {
            // shouldn't happen
            throw new Error('DC manager already exists')
        }

        this._dcConnections[defaultDc.id] = new DcConnectionManager(
            this,
            defaultDc.id,
            defaultDc
        )
        this._switchPrimaryDc(this._dcConnections[defaultDc.id])
    }

    destroy(): void {
        for (const dc of Object.values(this._dcConnections)) {
            dc.mainConnection.destroy()
        }
        if (this._keepAliveInterval) clearInterval(this._keepAliveInterval)
    }
}
