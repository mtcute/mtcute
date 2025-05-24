import type { BasicDcOption } from '@mtcute/core/utils.js'
import { FakeConnection } from '@fuman/net'
import { IntermediatePacketCodec, type IPacketCodec, type ITelegramConnection, type TelegramTransport } from '@mtcute/core'

// todo: fix this in fuman
class FakeConnectionFixed<T> extends FakeConnection<T> {
    override async write(data: Uint8Array): Promise<void> {
        // eslint-disable-next-line ts/no-unsafe-call
        await this['tx'].write(data)
    }
}

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
        return new FakeConnectionFixed<BasicDcOption>(dc)
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
