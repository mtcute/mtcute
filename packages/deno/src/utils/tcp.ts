import type { ITcpConnection } from '@fuman/net'
import type { BasicDcOption } from '@mtcute/core/utils.js'
import { connectTcp } from '@fuman/deno'
import { IntermediatePacketCodec, type TelegramTransport } from '@mtcute/core'

export class TcpTransport implements TelegramTransport {
    connect(dc: BasicDcOption): Promise<ITcpConnection> {
        return connectTcp({ address: dc.ipAddress, port: dc.port })
    }

    packetCodec(): IntermediatePacketCodec {
        return new IntermediatePacketCodec()
    }
}
