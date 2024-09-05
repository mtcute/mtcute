import { connectTcp } from '@fuman/bun-net'
import { IntermediatePacketCodec, type TelegramTransport } from '@mtcute/core'

export const TcpTransport: TelegramTransport = {
    connect: dc => connectTcp({ address: dc.ipAddress, port: dc.port }),
    packetCodec: () => new IntermediatePacketCodec(),
}
