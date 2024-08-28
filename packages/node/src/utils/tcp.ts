import { connectTcp } from '@fuman/node-net'
import type { TelegramTransport } from '@mtcute/core'
import { IntermediatePacketCodec } from '@mtcute/core'

export const TcpTransport: TelegramTransport = {
    connect: dc => connectTcp({ address: dc.ipAddress, port: dc.port }),
    packetCodec: () => new IntermediatePacketCodec(),
}
