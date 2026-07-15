import type { ITcpConnection } from '@fuman/net'
import type { TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'
import { connectTcp } from '@fuman/bun'
import { IntermediatePacketCodec } from '@mtcute/core'

export class TcpTransport implements TelegramTransport {
  async connect(dc: BasicDcOption, abortSignal: AbortSignal): Promise<ITcpConnection> {
    const conn = await connectTcp({ address: dc.ipAddress, port: dc.port }, abortSignal)
    conn.setNoDelay(true)
    conn.setKeepAlive(true)
    return conn
  }

  packetCodec(): IntermediatePacketCodec {
    return new IntermediatePacketCodec()
  }
}
