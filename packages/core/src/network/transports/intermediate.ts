import { dataViewFromBuffer, getRandomInt, ICryptoProvider } from '../../utils/index.js'
import { IPacketCodec, TransportError } from './abstract.js'
import { StreamedCodec } from './streamed.js'

const TAG = new Uint8Array([0xee, 0xee, 0xee, 0xee])
const PADDED_TAG = new Uint8Array([0xdd, 0xdd, 0xdd, 0xdd])

/**
 * Intermediate packet codec.
 * See https://core.telegram.org/mtproto/mtproto-transports#intermediate
 */
export class IntermediatePacketCodec extends StreamedCodec implements IPacketCodec {
    tag(): Uint8Array {
        return TAG
    }

    encode(packet: Uint8Array): Uint8Array {
        const ret = new Uint8Array(packet.length + 4)
        const dv = dataViewFromBuffer(ret)
        dv.setUint32(0, packet.length, true)
        ret.set(packet, 4)

        return ret
    }

    protected _packetAvailable(): boolean {
        return this._stream.length >= 8
    }

    protected _handlePacket(): boolean {
        const dv = dataViewFromBuffer(this._stream)
        const payloadLength = dv.getUint32(0, true)

        if (payloadLength <= this._stream.length - 4) {
            if (payloadLength === 4) {
                const code = dv.getInt32(4, true) * -1
                this.emit('error', new TransportError(code))
            } else {
                const payload = this._stream.subarray(4, payloadLength + 4)
                this.emit('packet', payload)
            }

            this._stream = this._stream.subarray(payloadLength + 4)

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
    tag(): Uint8Array {
        return PADDED_TAG
    }

    private _crypto!: ICryptoProvider
    setup?(crypto: ICryptoProvider) {
        this._crypto = crypto
    }

    encode(packet: Uint8Array): Uint8Array {
        // padding size, 0-15
        const padSize = getRandomInt(16)

        const ret = new Uint8Array(packet.length + 4 + padSize)
        const dv = dataViewFromBuffer(ret)
        dv.setUint32(0, packet.length + padSize, true)
        ret.set(packet, 4)
        this._crypto.randomFill(ret.subarray(4 + packet.length))

        return ret
    }
}
