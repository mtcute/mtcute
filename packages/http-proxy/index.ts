// ^^ because of this._socket. we know it's not null, almost everywhere, but TS doesn't

import { connect as connectTcp } from 'net'
import { connect as connectTls, SecureContextOptions } from 'tls'

import { BaseTcpTransport, IntermediatePacketCodec, MtcuteError, tl, TransportState } from '@mtcute/core'
import { base64Encode, utf8EncodeToBuffer } from '@mtcute/core/utils.js'

/**
 * An error has occurred while connecting to an HTTP(s) proxy
 */
export class HttpProxyConnectionError extends Error {
    readonly proxy: HttpProxySettings

    constructor(proxy: HttpProxySettings, message: string) {
        super(`Error while connecting to ${proxy.host}:${proxy.port}: ${message}`)
        this.proxy = proxy
    }
}

/**
 * HTTP(s) proxy settings
 */
export interface HttpProxySettings {
    /**
     * Host or IP of the proxy (e.g. `proxy.example.com`, `1.2.3.4`)
     */
    host: string

    /**
     * Port of the proxy (e.g. `8888`)
     */
    port: number

    /**
     * Proxy authorization username, if needed
     */
    user?: string

    /**
     * Proxy authorization password, if needed
     */
    password?: string

    /**
     * Proxy connection headers, if needed
     */
    headers?: Record<string, string>

    /**
     * Whether this is a HTTPS proxy (i.e. the client
     * should connect to the proxy server via TLS)
     */
    tls?: boolean

    /**
     * Additional TLS options, used if `tls = true`.
     * Can contain stuff like custom certificate, host,
     * or whatever.
     */
    tlsOptions?: SecureContextOptions
}

/**
 * TCP transport that connects via an HTTP(S) proxy.
 */
export abstract class BaseHttpProxyTcpTransport extends BaseTcpTransport {
    readonly _proxy: HttpProxySettings

    constructor(proxy: HttpProxySettings) {
        super()
        this._proxy = proxy
    }

    connect(dc: tl.RawDcOption): void {
        if (this._state !== TransportState.Idle) {
            throw new MtcuteError('Transport is not IDLE')
        }

        if (!this.packetCodecInitialized) {
            this._packetCodec.on('error', (err) => this.emit('error', err))
            this._packetCodec.on('packet', (buf) => this.emit('message', buf))
            this.packetCodecInitialized = true
        }

        this._state = TransportState.Connecting
        this._currentDc = dc

        this._socket = this._proxy.tls ?
            connectTls(this._proxy.port, this._proxy.host, this._proxy.tlsOptions, this._onProxyConnected.bind(this)) :
            connectTcp(this._proxy.port, this._proxy.host, this._onProxyConnected.bind(this))

        this._socket.on('error', this.handleError.bind(this))
        this._socket.on('close', this.close.bind(this))
    }

    private _onProxyConnected() {
        this.log.debug('[%s:%d] connected to proxy, sending CONNECT', this._proxy.host, this._proxy.port)

        let ip = `${this._currentDc!.ipAddress}:${this._currentDc!.port}`
        if (this._currentDc!.ipv6) ip = `[${ip}]`

        const headers = {
            ...(this._proxy.headers ?? {}),
        }
        headers.Host = ip

        if (this._proxy.user) {
            let auth = this._proxy.user

            if (this._proxy.password) {
                auth += ':' + this._proxy.password
            }
            headers['Proxy-Authorization'] = 'Basic ' + base64Encode(utf8EncodeToBuffer(auth))
        }
        headers['Proxy-Connection'] = 'Keep-Alive'

        const headersStr = Object.keys(headers)
            .map((k) => `\r\n${k}: ${headers[k]}`)
            .join('')
        const packet = `CONNECT ${ip} HTTP/1.1${headersStr}\r\n\r\n`

        this._socket!.write(packet)
        this._socket!.once('data', (msg) => {
            this.log.debug('[%s:%d] CONNECT resulted in: %s', this._proxy.host, this._proxy.port, msg)

            const [proto, code, name] = msg.toString().split(' ')

            if (!proto.match(/^HTTP\/1.[01]$/i)) {
                // wtf?
                this._socket!.emit(
                    'error',
                    new HttpProxyConnectionError(this._proxy, `Server returned invalid protocol: ${proto}`),
                )

                return
            }

            if (code[0] !== '2') {
                this._socket!.emit(
                    'error',
                    new HttpProxyConnectionError(this._proxy, `Server returned error: ${code} ${name}`),
                )

                return
            }

            // all ok, connection established, can now call handleConnect
            this._socket!.on('data', (data) => this._packetCodec.feed(data))
            this.handleConnect()
        })
    }
}

/**
 * HTTP(s) TCP transport using an intermediate packet codec.
 *
 * Should be the one passed as `transport` to {@link TelegramClient} constructor
 * (unless you want to use a custom codec).
 */
export class HttpProxyTcpTransport extends BaseHttpProxyTcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
