import type { ITcpConnection } from '@fuman/net'
import type { TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'
import { connectTcp } from '@fuman/deno'
import { IntermediatePacketCodec } from '@mtcute/core'

export class TcpTransport implements TelegramTransport {
  connect(dc: BasicDcOption): Promise<ITcpConnection> {
    return connectTcp({ address: dc.ipAddress, port: dc.port })
  }

  packetCodec(): IntermediatePacketCodec {
    return new IntermediatePacketCodec()
  }
}
