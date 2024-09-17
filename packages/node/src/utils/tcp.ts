import type { ITcpConnection } from '@fuman/net'
import { connectTcp } from '@fuman/node'
import type { TelegramTransport } from '@mtcute/core'
import { IntermediatePacketCodec } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'

export class TcpTransport implements TelegramTransport {
    connect(dc: BasicDcOption): Promise<ITcpConnection> {
        return connectTcp({ address: dc.ipAddress, port: dc.port })
    }

    packetCodec(): IntermediatePacketCodec {
        return new IntermediatePacketCodec()
    }
}
