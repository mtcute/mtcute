/* eslint-disable @typescript-eslint/require-await */
import { tl } from '@mtcute/tl'

import { MtClient, MtClientOptions } from '../network/client.js'
import { ConnectionKind, RpcCallOptions } from '../network/network-manager.js'
import { StorageManagerExtraOptions } from '../storage/storage.js'
import { MtArgumentError } from '../types/errors.js'
import { MustEqual } from '../types/utils.js'
import {
    asyncResettable,
    computeNewPasswordHash,
    computeSrpParams,
    readStringSession,
    StringSessionData,
    writeStringSession,
} from '../utils/index.js'
import { LogManager } from '../utils/logger.js'
import { ConnectionState, ITelegramClient } from './client.types.js'
import { AppConfigManager } from './managers/app-config-manager.js'
import { ITelegramStorageProvider } from './storage/provider.js'
import { TelegramStorageManager, TelegramStorageManagerExtraOptions } from './storage/storage.js'
import { UpdatesManager } from './updates/manager.js'
import { RawUpdateHandler, UpdatesManagerParams } from './updates/types.js'

export interface BaseTelegramClientOptions extends MtClientOptions {
    storage: ITelegramStorageProvider
    storageOptions?: StorageManagerExtraOptions & TelegramStorageManagerExtraOptions
    updates?: UpdatesManagerParams | false
}

export class BaseTelegramClient implements ITelegramClient {
    readonly updates?: UpdatesManager
    private _serverUpdatesHandler: (updates: tl.TypeUpdates) => void = () => {}
    private _connectionStateHandler: (state: ConnectionState) => void = () => {}

    readonly log
    readonly mt
    readonly crypto
    readonly storage

    constructor(readonly params: BaseTelegramClientOptions) {
        this.log = this.params.logger ?? new LogManager('client')
        this.mt = new MtClient({
            ...this.params,
            logger: this.log.create('mtproto'),
        })

        if (!params.disableUpdates && params.updates !== false) {
            this.updates = new UpdatesManager(this, params.updates)
            this._serverUpdatesHandler = this.updates.handleUpdate.bind(this.updates)
            this.updates.onCatchingUp((catchingUp) => {
                this._connectionStateHandler(catchingUp ? 'updating' : 'connected')
            })
        }

        this.mt.on('update', (update: tl.TypeUpdates) => {
            this._serverUpdatesHandler(update)
        })
        this.mt.on('usable', () => {
            this._connectionStateHandler('connected')
        })
        this.mt.on('wait', () => {
            this._connectionStateHandler('connecting')
        })
        this.mt.on('networkChanged', (connected: boolean) => {
            if (!connected) {
                this._connectionStateHandler('offline')
            }
        })

        this.crypto = this.mt.crypto
        this.storage = new TelegramStorageManager(this.mt.storage, {
            provider: this.params.storage,
            ...this.params.storageOptions,
        })
    }
    readonly appConfig = new AppConfigManager(this)

    private _prepare = asyncResettable(async () => {
        await this.mt.prepare()

        const self = await this.storage.self.fetch()
        this.log.prefix = `[USER ${self?.userId ?? 'n/a'}] `
        this.mt.network.setIsPremium(self?.isPremium ?? false)

        await this.updates?.prepare()
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

    // used in a hot path, avoid extra function calls
    private _connected = false
    private _connect = asyncResettable(async () => {
        await this._prepare.run()
        await this.mt.connect()
        this._connected = true
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

    get isConnected(): boolean {
        return this._connected
    }

    async close(): Promise<void> {
        this._connected = false
        await this.mt.close()
        this.updates?.stopLoop()
        this._prepare.reset()
        this._connect.reset()
    }

    async notifyLoggedIn(auth: tl.auth.TypeAuthorization | tl.RawUser): Promise<tl.RawUser> {
        const user = this.mt.network.notifyLoggedIn(auth)

        this.log.prefix = `[USER ${user.id}] `
        const self = await this.storage.self.storeFrom(user)

        this.updates?.notifyLoggedIn(self)

        return user
    }

    async notifyLoggedOut(): Promise<void> {
        this.mt.network.notifyLoggedOut()

        this.log.prefix = '[USER n/a] '
        await this.storage.self.store(null)
    }

    async notifyChannelOpened(channelId: number, pts?: number): Promise<boolean> {
        return this.updates?.notifyChannelOpened(channelId, pts) ?? false
    }

    async notifyChannelClosed(channelId: number): Promise<boolean> {
        return this.updates?.notifyChannelClosed(channelId) ?? false
    }

    async startUpdatesLoop(): Promise<void> {
        await this.updates?.startLoop()
    }

    async stopUpdatesLoop(): Promise<void> {
        this.updates?.stopLoop()
    }

    /**
     * Make an RPC call
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
        if (!this._connected) {
            await this._connect.run()
        }

        const res = await this.mt.call(message, params)

        await this.storage.peers.updatePeersFrom(res)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return res
    }

    /**
     * Import the session from the given session string.
     *
     * Note that the session will only be imported in case
     * the storage is missing authorization (i.e. does not contain
     * auth key for the primary DC), otherwise it will be ignored (unless `force`).
     *
     * @param session  Session string to import
     * @param force  Whether to overwrite existing session
     */
    async importSession(session: string | StringSessionData, force = false): Promise<void> {
        await this.prepare()

        const defaultDcAuthKey = await this.mt.storage.provider.authKeys.get(this.mt._defaultDcs.main.id)

        if (defaultDcAuthKey && !force) return

        const data = typeof session === 'string' ? readStringSession(session) : session

        if (data.testMode && !this.params.testMode) {
            throw new Error(
                'This session string is not for the current backend. ' +
                    `Session is ${data.testMode ? 'test' : 'prod'}, ` +
                    `but the client is ${this.params.testMode ? 'test' : 'prod'}`,
            )
        }

        this.mt._defaultDcs = data.primaryDcs
        await this.mt.storage.dcs.store(data.primaryDcs)

        if (data.self) {
            await this.storage.self.store(data.self)
        }

        await this.mt.storage.provider.authKeys.set(data.primaryDcs.main.id, data.authKey)

        await this.mt.storage.save()
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
        await this._prepare.run()

        const primaryDcs = (await this.mt.storage.dcs.fetch()) ?? this.mt._defaultDcs

        const authKey = await this.mt.storage.provider.authKeys.get(primaryDcs.main.id)
        if (!authKey) throw new Error('Auth key is not ready yet')

        return writeStringSession({
            version: 3,
            self: await this.storage.self.fetch(),
            testMode: Boolean(this.params.testMode),
            primaryDcs,
            authKey,
        })
    }

    /**
     * Register an error handler for the client
     *
     * @param handler  Error handler.
     */
    onError(handler: (err: unknown) => void): void {
        this.mt.onError(handler)
    }

    emitError(err: unknown): void {
        this.mt.emitError(err)
    }

    handleClientUpdate(updates: tl.TypeUpdates, noDispatch?: boolean): void {
        this.updates?.handleClientUpdate(updates, noDispatch)
    }

    onServerUpdate(handler: (update: tl.TypeUpdates) => void): void {
        this._serverUpdatesHandler = handler
    }

    onUpdate(handler: RawUpdateHandler): void {
        if (!this.updates) {
            throw new MtArgumentError('Updates manager is disabled')
        }

        this.updates.setHandler(handler)
    }

    onConnectionState(handler: (state: ConnectionState) => void): void {
        this._connectionStateHandler = handler
    }

    async getApiCrenetials() {
        return {
            id: this.params.apiId,
            hash: this.params.apiHash,
        }
    }

    async getPoolSize(kind: ConnectionKind, dcId?: number): Promise<number> {
        if (!this._connected) {
            await this._connect.run()
        }

        return this.mt.network.getPoolSize(kind, dcId)
    }

    async getPrimaryDcId(): Promise<number> {
        if (!this._connected) {
            await this._connect.run()
        }

        return this.mt.network.getPrimaryDcId()
    }

    computeSrpParams(request: tl.account.RawPassword, password: string): Promise<tl.RawInputCheckPasswordSRP> {
        return computeSrpParams(this.crypto, request, password)
    }
    computeNewPasswordHash(algo: tl.TypePasswordKdfAlgo, password: string): Promise<Uint8Array> {
        return computeNewPasswordHash(this.crypto, algo, password)
    }

    get stopSignal(): AbortSignal {
        return this.mt.stopSignal
    }
}
