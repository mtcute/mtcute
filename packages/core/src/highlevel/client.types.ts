import type { Emitter } from '@fuman/utils'
import type { tl } from '@mtcute/tl'
import type Long from 'long'

import type { ConnectionKind, RpcCallOptions } from '../network/index.js'
import type { ICorePlatform } from '../types/platform.js'
import type { MustEqual, PublicPart } from '../types/utils.js'
import type { Logger } from '../utils/logger.js'

import type { AppConfigManager } from './managers/app-config-manager.js'
import type { TimersManager } from './managers/timers.js'
import type { TelegramStorageManager } from './storage/storage.js'
import type { RawUpdateInfo } from './updates/types.js'
import type { InputStringSessionData } from './utils/string-session.js'

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
    /** Logger for the client */
    readonly log: Logger
    /** Storage manager */
    readonly storage: PublicPart<TelegramStorageManager>
    /** App config manager */
    readonly appConfig: PublicPart<AppConfigManager>
    /** Timers manager */
    readonly timers: Pick<TimersManager, 'create' | 'cancel' | 'exists'>
    /** Signal that will be aborted when the client is destroyed */
    readonly stopSignal: AbortSignal
    /** Platform used by the client */
    readonly platform: ICorePlatform

    /**
     * **ADVANCED**
     *
     * Do all the preparations, but don't connect just yet.
     * Useful when you want to do some preparations before
     * connecting, like setting up session.
     *
     * Call {@link connect} to actually connect.
     */
    prepare(): Promise<void>

    /**
     * Initialize the connection to the primary DC.
     *
     * You shouldn't usually call this method directly as it is called
     * implicitly the first time you call {@link call}.
     */
    connect(): Promise<void>

    /**
     * Terminate any connections to the Telegram servers, but keep the client usable
     */
    disconnect(): Promise<void>

    /**
     * Destroy the client and all its resources.
     *
     * This will terminate any connections to the Telegram servers,
     * free all the resources, and make the client no longer usable
     */
    destroy(): Promise<void>

    /** Notify the client that the user has logged in */
    notifyLoggedIn(auth: tl.auth.TypeAuthorization | tl.RawUser): Promise<tl.RawUser>
    /** Notify the client that the user has logged out */
    notifyLoggedOut(): Promise<void>
    /** Notify the client that a channel has been opened */
    notifyChannelOpened(channelId: number, pts?: number): Promise<boolean>
    /** Notify the client that a channel has been closed */
    notifyChannelClosed(channelId: number): Promise<boolean>

    /** Start the updates loop */
    startUpdatesLoop(): Promise<void>
    /** Stop the updates loop */
    stopUpdatesLoop(): Promise<void>

    /** Call an RPC method */
    call<T extends tl.RpcMethod>(
        message: MustEqual<T, tl.RpcMethod>,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']]>

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
    importSession(session: string | InputStringSessionData, force?: boolean): Promise<void>

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
    exportSession(): Promise<string>

    /**
     * Handle an update sent by the server in response to an RPC call
     *
     * @param updates  Updates to handle
     * @param noDispatch  Whether the updates inside should not be dispatched as events
     */
    handleClientUpdate(updates: tl.TypeUpdates, noDispatch?: boolean): void

    /** Emitted when a low-level `Updates` updates is received */
    onServerUpdate: Emitter<tl.TypeUpdates>
    /** Emitted when an update is received from the server. Requires updates loop to be running */
    onRawUpdate: Emitter<RawUpdateInfo>
    /** Emitted when the connection state changes */
    onConnectionState: Emitter<ConnectionState>
    /** Emitted when an error occurs */
    onError: Emitter<Error>

    /** Get the API credentials for use in authorization methods */
    getApiCredentials(): Promise<{ id: number, hash: string }>

    // todo - this is only used for file dl/ul, which should probably be moved
    // to the client to allow moving the thing to worker
    // or at least load this once at startup (and then these methods can be made sync)
    /** Get the number of connections of the given kind */
    getPoolSize(kind: ConnectionKind, dcId?: number): Promise<number>
    /** Get the primary DC ID */
    getPrimaryDcId(): Promise<number>
    /** Change the primary DC */
    changePrimaryDc(newDc: number): Promise<void>

    /** Compute SRP parameters for the given password */
    computeSrpParams(request: tl.account.RawPassword, password: string): Promise<tl.RawInputCheckPasswordSRP>
    /** Compute new password hash for the given algorithm and password */
    computeNewPasswordHash(algo: tl.TypePasswordKdfAlgo, password: string): Promise<Uint8Array>
    /** Generate a new time-based MTProto message ID */
    getMtprotoMessageId(): Promise<Long>

    /**
     * **ADVANCED**
     * Recreate the given DC, forcefully using the IP taken from server config.
     */
    recreateDc(dcId: number): Promise<void>
}
