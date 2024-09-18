import { type IPacketCodec, type ITelegramConnection, IntermediatePacketCodec, type TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'
import { FakeConnection } from '@fuman/net'

export class StubTelegramTransport implements TelegramTransport {
    constructor(
        readonly params: {
            packetCodec?: () => IPacketCodec
            onConnect?: (dc: BasicDcOption) => void
            onClose?: () => void
            onMessage?: (msg: Uint8Array, dcId: number) => void
        },
    ) {}

    private _dcId = 0
    async connect(dc: BasicDcOption): Promise<ITelegramConnection> {
        this.params.onConnect?.(dc)
        this._dcId = dc.id
        return new FakeConnection<BasicDcOption>(dc)
    }

    packetCodec(): IPacketCodec {
        const inner = this.params.packetCodec?.() ?? new IntermediatePacketCodec()

        return {
            decode: (reader, eof) => inner.decode(reader, eof),
            reset: () => inner.reset(),
            tag: () => inner.tag(),
            encode: (message, into) => {
                this.params.onMessage?.(message, this._dcId)
                return inner.encode(message, into)
            },
        }
    }
}
