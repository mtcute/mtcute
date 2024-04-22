import EventEmitter from 'events'

import { tl } from '@mtcute/tl'

import { MaybePromise } from '../../types/index.js'
import { BasicDcOption, ICryptoProvider, Logger } from '../../utils/index.js'

/** Current state of the transport */
export enum TransportState {
    /**
     * Transport has no active connections nor trying to connect to anything
     * Can be a result of network failure, close() call, or connect() call was
     * never called on this instance of Transport.
     *
     * This state is usually immediately handled by more higher-level components,
     * thus rarely seen
     */
    Idle = 'idle',
    /**
     * Transport has no active connections, but is trying to connect to something
     */
    Connecting = 'connecting',
    /**
     * Transport has an active connection
     */
    Ready = 'ready',
}

/**
 * Interface implementing a transport to interact with Telegram servers.
 *
 * Events:
 *  - `ready` event is emitted once connection has been established: `() => void`
 *  - `close` event is emitted once connection has been closed: `() => void`
 *  - `error` event is event is emitted when there was some error
 *    (either mtproto related or network related): `(error: Error) => void`
 *  - `message` event is emitted when a mtproto message is received: `(message: Buffer) => void`
 */
export interface ITelegramTransport extends EventEmitter {
    /** returns current state */
    state(): TransportState
    /** returns current DC. should return null if state == IDLE */
    currentDc(): BasicDcOption | null

    /**
     * Start trying to connect to a specified DC.
     * Will throw an error if state != IDLE
     */
    connect(dc: BasicDcOption, testMode: boolean): void
    /** call to close existing connection to some DC */
    close(): MaybePromise<void>
    /** send a message */
    send(data: Uint8Array): Promise<void>

    /**
     * Provides crypto and logging for the transport.
     * Not done in constructor to simplify factory.
     *
     * This method is called before any other.
     */
    setup?(crypto: ICryptoProvider, log: Logger): void

    getMtproxyInfo?(): tl.RawInputClientProxy
}

/** Transport factory function */
export type TransportFactory = () => ITelegramTransport

/**
 * Interface declaring handling of received packets.
 * When receiving a packet, its content is sent to feed(),
 * and codec is supposed to emit `packet` or `error` event when packet is parsed.
 */
export interface IPacketCodec {
    /** Initial tag of the codec. Will be sent immediately once connected. */
    tag(): MaybePromise<Uint8Array>

    /** Encodes and frames a single packet */
    encode(packet: Uint8Array): MaybePromise<Uint8Array>

    /** Feed packet to the codec. Once packet is processed, codec is supposed to emit `packet` or `error` */
    feed(data: Uint8Array): void
    /** Reset codec state (for example, reset buffer) */
    reset(): void

    /** Remove all listeners from a codec, used to safely dispose it */
    removeAllListeners(): void

    /**
     * Emitted when a packet containing a
     * (Transport error)[https://core.telegram.org/mtproto/mtproto-transports#transport-errors] is encountered.
     */
    on(event: 'error', handler: (error: Error) => void): void
    /** Emitted when a full packet has been processed. */
    on(event: 'packet', handler: (packet: Uint8Array) => void): void

    /**
     * For codecs that use crypto functions and/or logging.
     * This method is called before any other.
     */
    setup?(crypto: ICryptoProvider, log: Logger): void
}

/**
 * Error that represents an error in an underlying transport
 * (and usually means either server-side problems or bug in library)
 *
 * More: https://core.telegram.org/mtproto/mtproto-transports#transport-errors
 */
export class TransportError extends Error {
    code: number

    constructor(code: number) {
        super(`Transport error: ${code}`)
        this.code = code
    }
}
