// @ts-expect-error wip
import { connectTcp } from '@fuman/deno'
import type { ITcpConnection } from '@fuman/net'
import { IntermediatePacketCodec, type TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'

export class TcpTransport implements TelegramTransport {
    connect(dc: BasicDcOption): Promise<ITcpConnection> {
        return connectTcp({ address: dc.ipAddress, port: dc.port })
    }

    packetCodec(): IntermediatePacketCodec {
        return new IntermediatePacketCodec()
    }
}
