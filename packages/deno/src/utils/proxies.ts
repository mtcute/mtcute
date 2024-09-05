import type { HttpProxySettings as FumanHttpProxySettings, ITcpConnection, SocksProxySettings, TcpEndpoint } from '@fuman/net'
import { performHttpProxyHandshake, performSocksHandshake } from '@fuman/net'
import { connectTcp, connectTls } from '@fuman/deno-net'
import { BaseMtProxyTransport, type ITelegramConnection, IntermediatePacketCodec, type TelegramTransport } from '@mtcute/core'
import type { BasicDcOption } from '@mtcute/core/utils.js'

export type { SocksProxySettings } from '@fuman/net'
export { SocksProxyConnectionError, HttpProxyConnectionError } from '@fuman/net'
export type { MtProxySettings } from '@mtcute/core'

export interface HttpProxySettings extends FumanHttpProxySettings {
    /**
     * Whether this is a HTTPS proxy (by default it is regular HTTP).
     */
    tls?: boolean
}

export class HttpProxyTcpTransport implements TelegramTransport {
    constructor(readonly proxy: HttpProxySettings) {}

    async connect(dc: BasicDcOption): Promise<ITelegramConnection> {
        let conn
        if (this.proxy.tls) {
            conn = await connectTls({
                address: this.proxy.host,
                port: this.proxy.port,
            })
        } else {
            conn = await connectTcp({
                address: this.proxy.host,
                port: this.proxy.port,
            })
        }

        await performHttpProxyHandshake(conn, conn, this.proxy, {
            address: dc.ipAddress,
            port: dc.port,
        })

        return conn
    }

    packetCodec(): IntermediatePacketCodec {
        return new IntermediatePacketCodec()
    }
}

export class SocksProxyTcpTransport implements TelegramTransport {
    constructor(readonly proxy: SocksProxySettings) {}

    async connect(dc: BasicDcOption): Promise<ITelegramConnection> {
        const conn = await connectTcp({
            address: this.proxy.host,
            port: this.proxy.port,
        })

        await performSocksHandshake(conn, conn, this.proxy, {
            address: dc.ipAddress,
            port: dc.port,
        })

        return conn
    }

    packetCodec(): IntermediatePacketCodec {
        return new IntermediatePacketCodec()
    }
}

export class MtProxyTcpTransport extends BaseMtProxyTransport {
    async _connectTcp(endpoint: TcpEndpoint): Promise<ITcpConnection> {
        return connectTcp(endpoint)
    }
}
