import { tl } from '@mtcute/tl'
import { TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { NetworkManagerExtraParams, ReconnectionStrategy, TransportFactory } from './network/index.js'
import { PersistentConnectionParams } from './network/persistent-connection.js'
import { ITelegramStorage } from './storage/abstract.js'
import { CryptoProviderFactory } from './utils/index.js'

/** Options for {@link BaseTelegramClient} */
export interface BaseTelegramClientOptions {
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
    storage: ITelegramStorage

    /**
     * Cryptography provider factory to allow delegating
     * crypto to native addon, worker, etc.
     */
    crypto?: CryptoProviderFactory

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
    defaultDcs?: ITelegramStorage.DcOptions

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
    transport?: TransportFactory

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
     * If true, every single API call will be wrapped with `tl.invokeWithoutUpdates`,
     * effectively disabling the server-sent events for the clients.
     * May be useful in some cases.
     *
     * Note that this only wraps calls made with `.call()` within the primary
     * connection. Additional connections and direct `.sendForResult()` calls
     * must be wrapped manually.
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
     * Set logging level for the client.
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
