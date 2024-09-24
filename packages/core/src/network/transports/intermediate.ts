import type { Bytes, ISyncWritable } from '@fuman/io'
import { read, write } from '@fuman/io'
import { typed } from '@fuman/utils'

import type { ICryptoProvider } from '../../utils/index.js'
import { getRandomInt } from '../../utils/index.js'

import type { IPacketCodec } from './abstract.js'
import { TransportError } from './abstract.js'

const TAG = new Uint8Array([0xEE, 0xEE, 0xEE, 0xEE])
const PADDED_TAG = new Uint8Array([0xDD, 0xDD, 0xDD, 0xDD])

/**
 * Intermediate packet codec.
 * See https://core.telegram.org/mtproto/mtproto-transports#intermediate
 */
export class IntermediatePacketCodec implements IPacketCodec {
    tag(): Uint8Array {
        return TAG
    }

    decode(reader: Bytes, eof: boolean): Uint8Array | null {
        if (eof) return null

        if (reader.available < 8) return null

        const length = read.uint32le(reader)

        if (length === 4) {
            // error
            const code = read.int32le(reader)
            throw new TransportError(-code)
        }

        if (reader.available < length) {
            reader.rewind(4)

            return null
        }

        return new Uint8Array(read.exactly(reader, length))
    }

    encode(frame: Uint8Array, into: ISyncWritable): void {
        write.uint32le(into, frame.length)
        write.bytes(into, frame)
    }

    reset(): void {}
}

/**
 * Padded intermediate packet codec.
 * See https://core.telegram.org/mtproto/mtproto-transports#padded-intermediate
 */
export class PaddedIntermediatePacketCodec extends IntermediatePacketCodec implements IPacketCodec {
    tag(): Uint8Array {
        return PADDED_TAG
    }

    private _crypto!: ICryptoProvider
    setup?(crypto: ICryptoProvider): void {
        this._crypto = crypto
    }

    encode(frame: Uint8Array, into: ISyncWritable): void {
        // padding size, 0-15
        const padSize = getRandomInt(16)

        const ret = into.writeSync(frame.length + 4 + padSize)
        const dv = typed.toDataView(ret)
        dv.setUint32(0, frame.length + padSize, true)
        ret.set(frame, 4)
        this._crypto.randomFill(ret.subarray(4 + frame.length))
        into.disposeWriteSync()
    }
}
