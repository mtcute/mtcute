import type { tl } from '@mtcute/tl'
import type { IFrameDecoder, IFrameEncoder } from '@fuman/io'
import type { IConnection } from '@fuman/net'

import type { MaybePromise } from '../../types/index.js'
import type { BasicDcOption, ICryptoProvider, Logger } from '../../utils/index.js'

/**
 * Interface implementing a transport to interact with Telegram servers.
 */
export interface ITelegramConnection extends IConnection<any, any> {
    /**
     * Provides crypto and logging for the transport.
     * Not done in constructor to simplify factory.
     *
     * This method is called before any other.
     */
    setup?(crypto: ICryptoProvider, log: Logger): void

    getMtproxyInfo?(): tl.RawInputClientProxy
}

export interface TelegramTransport {
    setup?(crypto: ICryptoProvider, log: Logger): void
    connect: (dc: BasicDcOption, testMode: boolean) => Promise<ITelegramConnection>
    packetCodec: (dc: BasicDcOption) => IPacketCodec
}

/**
 * Interface declaring handling of received packets.
 * When receiving a packet, its content is sent to feed(),
 * and codec is supposed to emit `packet` or `error` event when packet is parsed.
 */
export interface IPacketCodec extends IFrameDecoder, IFrameEncoder {
    /** Initial tag of the codec. Will be sent immediately once connected. */
    tag(): MaybePromise<Uint8Array>

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
