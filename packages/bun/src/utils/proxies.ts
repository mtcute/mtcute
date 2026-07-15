import type { HttpProxySettings as FumanHttpProxySettings, ITcpConnection, SocksProxySettings, TcpEndpoint } from '@fuman/net'
import type { ITelegramConnection, TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'
import { connectTcp, connectTls } from '@fuman/bun'
import { performHttpProxyHandshake, performSocksHandshake } from '@fuman/net'
import {
  BaseMtProxyTransport,
  createProxyTransportFactory,
  IntermediatePacketCodec,
  performHandshakeWithAbort,
} from '@mtcute/core'

export type { SocksProxySettings } from '@fuman/net'
export { HttpProxyConnectionError, SocksProxyConnectionError } from '@fuman/net'
export type { MtProxySettings } from '@mtcute/core'

export interface HttpProxySettings extends FumanHttpProxySettings {
  /**
   * Whether this is a HTTPS proxy (by default it is regular HTTP).
   */
  tls?: boolean
}

export class HttpProxyTcpTransport implements TelegramTransport {
  constructor(readonly proxy: HttpProxySettings) {}

  async connect(dc: BasicDcOption, abortSignal: AbortSignal): Promise<ITelegramConnection> {
    let conn
    if (this.proxy.tls) {
      conn = await connectTls({
        address: this.proxy.host,
        port: this.proxy.port,
      }, abortSignal)
    } else {
      conn = await connectTcp({
        address: this.proxy.host,
        port: this.proxy.port,
      }, abortSignal)
    }

    conn.setNoDelay(true)
    conn.setKeepAlive(true)

    return performHandshakeWithAbort(conn, abortSignal, () =>
      performHttpProxyHandshake(conn, conn, this.proxy, {
        address: dc.ipAddress,
        port: dc.port,
      }))
  }

  packetCodec(): IntermediatePacketCodec {
    return new IntermediatePacketCodec()
  }
}

export class SocksProxyTcpTransport implements TelegramTransport {
  constructor(readonly proxy: SocksProxySettings) {}

  async connect(dc: BasicDcOption, abortSignal: AbortSignal): Promise<ITelegramConnection> {
    const conn = await connectTcp({
      address: this.proxy.host,
      port: this.proxy.port,
    }, abortSignal)

    conn.setNoDelay(true)
    conn.setKeepAlive(true)

    return performHandshakeWithAbort(conn, abortSignal, () =>
      performSocksHandshake(conn, conn, this.proxy, {
        address: dc.ipAddress,
        port: dc.port,
      }))
  }

  packetCodec(): IntermediatePacketCodec {
    return new IntermediatePacketCodec()
  }
}

export class MtProxyTcpTransport extends BaseMtProxyTransport {
  async _connectTcp(endpoint: TcpEndpoint, abortSignal: AbortSignal): Promise<ITcpConnection> {
    const conn = await connectTcp(endpoint, abortSignal)
    conn.setNoDelay(true)
    conn.setKeepAlive(true)
    return conn
  }
}

/**
 * Create a proxy transport based on an url.
 *
 * Supported URLs (self-explanatory):
 * - `socks4://user:pass@1.2.3.4:80`
 * - `socks5://user:pass@1.2.3.4:80`
 * - `http://user:pass@1.2.3.4:80`
 * - `https://user:pass@1.2.3.4:443`
 * - `https://t.me/proxy?server=example.com&port=443&secret=3dpBFlW2hP6Hq_WOwiNeKBY`
 * @returns  Transport for that proxy
 */
export const proxyTransportFromUrl: (url: string) => TelegramTransport = createProxyTransportFactory({
  SocksProxyTcpTransport,
  HttpProxyTcpTransport,
  MtProxyTcpTransport,
})
