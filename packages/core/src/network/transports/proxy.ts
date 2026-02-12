import type { HttpProxySettings, SocksProxySettings } from '@fuman/net'
import type { MtProxySettings } from '../mtproxy/index.js'
import type { TelegramTransport } from './abstract.js'
import { MtArgumentError } from '../../types/errors.js'
import { links } from '../../utils/links/index.js'

export function createProxyTransportFactory(options: {
  SocksProxyTcpTransport?: new (options: SocksProxySettings) => TelegramTransport
  MtProxyTcpTransport?: new (options: MtProxySettings) => TelegramTransport
  HttpProxyTcpTransport?: new (options: HttpProxySettings & { tls?: boolean }) => TelegramTransport
}): (url: string) => TelegramTransport {
  const { SocksProxyTcpTransport, MtProxyTcpTransport, HttpProxyTcpTransport } = options

  return (url) => {
    const obj = new URL(url)
    if (SocksProxyTcpTransport != null && (obj.protocol === 'socks4:' || obj.protocol === 'socks5:')) {
      return new SocksProxyTcpTransport({
        version: obj.protocol === 'socks4:' ? 4 : 5,
        host: obj.hostname,
        port: Number(obj.port) || 1080,
        user: obj.username,
        password: obj.password,
      })
    }

    if (MtProxyTcpTransport != null) {
      const mtproxy = links.mtproxy.parse(url)
      if (mtproxy) {
        return new MtProxyTcpTransport({
          host: mtproxy.server,
          port: mtproxy.port,
          secret: mtproxy.secret,
        })
      }
    }

    if (HttpProxyTcpTransport && (obj.protocol === 'http:' || obj.protocol === 'https:')) {
      return new HttpProxyTcpTransport({
        tls: obj.protocol === 'https:',
        host: obj.hostname,
        port: Number(obj.port) || (obj.protocol === 'https:' ? 443 : 80),
        user: obj.username,
        password: obj.password,
      })
    } else {
      throw new MtArgumentError(`Unsupported proxy protocol: ${obj.protocol}`)
    }
  }
}
