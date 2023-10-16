import EventEmitter from 'events'

import { concatBuffers } from '../../utils/index.js'

/**
 * Base for streamed codecs.
 *
 * Streamed means that MTProto packet can be divided into
 * multiple transport packets.
 */
export abstract class StreamedCodec extends EventEmitter {
    protected _stream = new Uint8Array(0)

    /**
     * Should return whether a full packet is available
     * in `_stream` buffer
     */
    protected abstract _packetAvailable(): boolean

    /**
     * Handle a single (!) packet from `_stream` and emit `packet` or `error`.
     *
     * Should return true if there are more packets available, false otherwise
     */
    protected abstract _handlePacket(): boolean

    feed(data: Uint8Array): void {
        this._stream = concatBuffers([this._stream, data])

        while (this._packetAvailable()) {
            if (!this._handlePacket()) break
        }
    }

    reset(): void {
        this._stream = new Uint8Array(0)
    }
}
