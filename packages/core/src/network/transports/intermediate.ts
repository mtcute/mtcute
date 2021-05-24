import { PacketCodec, TransportError } from './abstract'
import { StreamedCodec } from './streamed'
import { randomBytes } from '../../utils/buffer-utils'

const TAG = Buffer.from([0xee, 0xee, 0xee, 0xee])
const PADDED_TAG = Buffer.from([0xdd, 0xdd, 0xdd, 0xdd])

/**
 * Intermediate packet codec.
 * See https://core.telegram.org/mtproto/mtproto-transports#intermediate
 */
export class IntermediatePacketCodec
    extends StreamedCodec
    implements PacketCodec {
    tag(): Buffer {
        return TAG
    }

    encode(packet: Buffer): Buffer {
        const ret = Buffer.alloc(packet.length + 4)
        ret.writeUInt32LE(packet.length)
        packet.copy(ret, 4)
        return ret
    }

    protected _packetAvailable(): boolean {
        return this._stream.length >= 8
    }

    protected _handlePacket(): boolean {
        const payloadLength = this._stream.readUInt32LE(0)

        if (payloadLength <= this._stream.length - 4) {
            if (payloadLength === 4) {
                const code = this._stream.readInt32LE(4) * -1
                this.emit('error', new TransportError(code))
            } else {
                const payload = this._stream.slice(4, payloadLength + 4)
                this.emit('packet', payload)
            }

            this._stream = this._stream.slice(payloadLength + 4)

            return true
        }
        return false
    }
}

/**
 * Padded intermediate packet codec.
 * See https://core.telegram.org/mtproto/mtproto-transports#padded-intermediate
 */
export class PaddedIntermediatePacketCodec extends IntermediatePacketCodec {
    tag(): Buffer {
        return PADDED_TAG
    }

    encode(packet: Buffer): Buffer {
        // padding size, 0-15
        const padSize = Math.floor(Math.random() * 16)
        const padding = randomBytes(padSize)

        const ret = Buffer.alloc(packet.length + 4 + padSize)
        ret.writeUInt32LE(packet.length + padSize)
        packet.copy(ret, 4)
        padding.copy(ret, 4 + ret.length)
        return ret
    }
}
