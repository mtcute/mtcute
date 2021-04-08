import { PacketCodec, TransportError } from './abstract'
import { StreamedCodec } from './streamed'
import { TcpTransport } from './tcp'

const TAG = Buffer.from([0xee, 0xee, 0xee, 0xee])

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
            const payload = this._stream.slice(4, payloadLength + 4)

            if (payloadLength === 4) {
                const code = this._stream.readInt32LE(4) * -1

                this.emit('error', new TransportError(code))
            } else {
                this.emit('packet', payload)
            }

            this._stream = this._stream.slice(payloadLength + 4)

            return true
        }
        return false
    }
}

export class TcpIntermediateTransport extends TcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
