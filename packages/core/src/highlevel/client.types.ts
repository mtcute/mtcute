import { tl } from '@mtcute/tl'

import type { ConnectionKind, RpcCallOptions } from '../network/index.js'
import type { MustEqual, PublicPart } from '../types/utils.js'
import type { Logger } from '../utils/logger.js'
import type { AppConfigManager } from './managers/app-config-manager.js'
import type { TelegramStorageManager } from './storage/storage.js'
import type { RawUpdateHandler } from './updates/types.js'
import type { StringSessionData } from './utils/string-session.js'

/**
 * Connection state of the client
 *
 * - `offline` - not connected (only emitted when {@link ICorePlatform.onNetworkChanged} callback
 *   is called with `false`)
 * - `connecting` - currently connecting. All requests will be queued until the connection is established
 * - `updating` - connected and is currently updating the state (i.e. downloading missing updates).
 *   At this point client is already fully operational, but some updates may be missing.
 *   Is only emitted when updates manager is enabled.
 * - `connected` - connected and ready to send requests. When updates manager is enabled, this state
 *   may be emitted before `updating` state
 */
export type ConnectionState = 'offline' | 'connecting' | 'updating' | 'connected'

// NB: when adding new methods, don't forget to add them to:
//  - worker/port.ts
//  - generate-client script

export interface ITelegramClient {
    readonly log: Logger
    readonly storage: PublicPart<TelegramStorageManager>
    readonly appConfig: PublicPart<AppConfigManager>
    readonly stopSignal: AbortSignal

    prepare(): Promise<void>
    connect(): Promise<void>
    close(): Promise<void>
    notifyLoggedIn(auth: tl.auth.TypeAuthorization | tl.RawUser): Promise<tl.RawUser>
    notifyLoggedOut(): Promise<void>
    notifyChannelOpened(channelId: number, pts?: number): Promise<boolean>
    notifyChannelClosed(channelId: number): Promise<boolean>
    startUpdatesLoop(): Promise<void>
    stopUpdatesLoop(): Promise<void>
    call<T extends tl.RpcMethod>(
        message: MustEqual<T, tl.RpcMethod>,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']]>
    importSession(session: string | StringSessionData, force?: boolean): Promise<void>
    exportSession(): Promise<string>
    onError(handler: (err: unknown) => void): void
    emitError(err: unknown): void
    handleClientUpdate(updates: tl.TypeUpdates, noDispatch?: boolean): void

    onServerUpdate(handler: (update: tl.TypeUpdates) => void): void
    onUpdate(handler: RawUpdateHandler): void
    onConnectionState(handler: (state: ConnectionState) => void): void

    getApiCrenetials(): Promise<{ id: number; hash: string }>
    // todo - this is only used for file dl/ul, which should probably be moved
    // to the client to allow moving the thing to worker
    // or at least load this once at startup (and then these methods can be made sync)
    getPoolSize(kind: ConnectionKind, dcId?: number): Promise<number>
    getPrimaryDcId(): Promise<number>

    computeSrpParams(request: tl.account.RawPassword, password: string): Promise<tl.RawInputCheckPasswordSRP>
    computeNewPasswordHash(algo: tl.TypePasswordKdfAlgo, password: string): Promise<Uint8Array>
}
