import type { mtp } from '@mtcute/tl'
import type Long from 'long'
import type { MtClientOptions } from '../network/client.js'
import type { ConnectionKind, RpcCallOptions } from '../network/network-manager.js'

import type { StorageManagerExtraOptions } from '../storage/storage.js'
import type { ICorePlatform } from '../types/platform.js'
import type { MustEqual } from '../types/utils.js'
import type {
    ICryptoProvider,
    InputStringSessionData,
    Logger,
} from '../utils/index.js'
import type { ConnectionState, ITelegramClient } from './client.types.js'
import type { ITelegramStorageProvider } from './storage/provider.js'
import type { TelegramStorageManagerExtraOptions } from './storage/storage.js'
import type { RawUpdateInfo, UpdatesManagerParams } from './updates/types.js'
import { Emitter, unknownToError } from '@fuman/utils'
import { tl } from '@mtcute/tl'

import { MtClient } from '../network/client.js'
import { reportUnknownError } from '../utils/error-reporting.js'
import {
    asyncResettable,
    computeNewPasswordHash,
    computeSrpParams,
    isTlRpcError,
    readStringSession,
    writeStringSession,
} from '../utils/index.js'
import { LogManager } from '../utils/logger.js'
import { AppConfigManager } from './managers/app-config-manager.js'
import { TimersManager } from './managers/timers.js'
import { TelegramStorageManager } from './storage/storage.js'
import { UpdatesManager } from './updates/manager.js'

export interface BaseTelegramClientOptions extends MtClientOptions {
    storage: ITelegramStorageProvider
    storageOptions?: StorageManagerExtraOptions & TelegramStorageManagerExtraOptions
    updates?: UpdatesManagerParams | false
}

function makeRpcError(raw: mtp.RawMt_rpc_error, stack: string, method?: string) {
    const error = tl.RpcError.fromTl(raw)
    error.stack = `RpcError (${error.code} ${error.text}): ${error.message}\n    at ${method}\n${stack
        .split('\n')
        .slice(2)
        .join('\n')}`

    return error
}

export class BaseTelegramClient implements ITelegramClient {
    readonly updates?: UpdatesManager

    readonly log: Logger
    readonly mt: MtClient
    readonly crypto: ICryptoProvider
    readonly storage: TelegramStorageManager
    readonly platform: ICorePlatform
    readonly timers: TimersManager

    readonly onServerUpdate: Emitter<tl.TypeUpdates> = new Emitter()
    readonly onRawUpdate: Emitter<RawUpdateInfo> = new Emitter()
    readonly onConnectionState: Emitter<ConnectionState> = new Emitter()

    constructor(readonly params: BaseTelegramClientOptions) {
        this.log = this.params.logger ?? new LogManager('client', params.platform)
        this.platform = this.params.platform
        this.mt = new MtClient({
            ...this.params,
            logger: this.log.create('mtproto'),
            onError: (err) => {
                if (this.onError.length > 0) {
                    this.onError.emit(unknownToError(err))
                } else if (this._connect.finished()) {
                    this.log.error('unhandled error:', err)
                }
            },
        })

        if (!params.disableUpdates && params.updates !== false) {
            this.updates = new UpdatesManager(this, params.updates)
            this.onServerUpdate.add(this.updates.handleUpdate.bind(this.updates))
            this.updates.onCatchingUp((catchingUp) => {
                this.onConnectionState.emit(catchingUp ? 'updating' : 'connected')
            })
        }

        this.mt.onUpdate.forwardTo(this.onServerUpdate)
        this.mt.onUsable.add(() => this.onConnectionState.emit('connected'))
        this.mt.onConnecting.add(() => this.onConnectionState.emit('connecting'))
        this.mt.onNetworkChanged.add((connected: boolean) => {
            if (!connected) {
                this.onConnectionState.emit('offline')
            }
        })

        this.crypto = this.mt.crypto
        this.storage = new TelegramStorageManager(this.mt.storage, {
            provider: this.params.storage,
            ...this.params.storageOptions,
        })
        this.timers = new TimersManager()
        this.timers.onError(err => this.onError.emit(unknownToError(err)))
    }

    readonly appConfig: AppConfigManager = new AppConfigManager(this)

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
    prepare(): Promise<void> {
        return this._prepare.run()
    }

    // used in a hot path, avoid extra function calls
    private _connected = false
    private _connect = asyncResettable(async () => {
        if (this.#destroyed) throw new Error('Client is destroyed')
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

    async disconnect(): Promise<void> {
        this._connected = false
        this.timers.destroy()
        this.updates?.stopLoop()
        await this.storage.close()
        this._prepare.reset()
        this._connect.reset()
        await this.mt.disconnect()
    }

    #destroyed = false
    async destroy(): Promise<void> {
        if (this.#destroyed) return
        this.#destroyed = true
        await this.disconnect()
        await this.mt.destroy()
    }

    [Symbol.asyncDispose](): Promise<void> {
        return this.destroy()
    }

    async notifyLoggedIn(auth: tl.auth.TypeAuthorization | tl.RawUser): Promise<tl.RawUser> {
        const user = this.mt.network.notifyLoggedIn(auth)

        this.log.prefix = `[USER ${user.id}] `
        await this.storage.self.storeFrom(user)

        this.updates?.notifyLoggedIn()

        return user
    }

    async notifyLoggedOut(): Promise<void> {
        this.mt.network.notifyLoggedOut()

        this.log.prefix = '[USER n/a] '
        await this.storage.self.store(null)

        // drop non-primary auth keys because they are no longer valid
        const primaryDc = this.mt.network.getPrimaryDcId()
        for (const dcId of [1, 2, 3, 4, 5]) { // lol
            if (dcId === primaryDc) continue
            await this.mt.storage.provider.authKeys.deleteByDc(dcId)
        }
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

        if (isTlRpcError(res)) {
            // eslint-disable-next-line unicorn/error-message
            const error = makeRpcError(res, new Error().stack ?? '', message._)

            if (error.unknown && this.params.enableErrorReporting) {
                reportUnknownError(this.log, error, message._)
            }

            throw error
        }

        await this.storage.peers.updatePeersFrom(res)

        // eslint-disable-next-line ts/no-unsafe-return
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
    async importSession(session: string | InputStringSessionData, force = false): Promise<void> {
        await this.prepare()

        const defaultDcAuthKey = await this.mt.storage.provider.authKeys.get(this.mt._defaultDcs.main.id)

        if (defaultDcAuthKey && !force) return

        const data = readStringSession(session)
        const testMode = data.primaryDcs.main.testMode

        if (testMode && !this.params.testMode) {
            throw new Error(
                'This session string is not for the current backend. '
                + `Session is ${testMode ? 'test' : 'prod'}, `
                + `but the client is ${this.params.testMode ? 'test' : 'prod'}`,
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
            primaryDcs,
            authKey,
        })
    }

    onError: Emitter<Error> = new Emitter()

    handleClientUpdate(updates: tl.TypeUpdates, noDispatch?: boolean): void {
        this.updates?.handleClientUpdate(updates, noDispatch)
    }

    async getApiCredentials(): Promise<{
        id: number
        hash: string
    }> {
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

    changePrimaryDc(dcId: number): Promise<void> {
        return this.mt.network.changePrimaryDc(dcId)
    }

    async getMtprotoMessageId(): Promise<Long> {
        return this.mt.network.getMtprotoMessageId()
    }

    async recreateDc(dcId: number): Promise<void> {
        await this.mt.network.config.update(true)
        await this.mt.network.recreateDc(dcId)
    }
}
