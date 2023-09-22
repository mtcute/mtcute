// ^^ because of this._socket. we know it's not null, almost everywhere, but TS doesn't

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { normalize } from 'ip6'
import { connect } from 'net'

import {
    assertNever,
    BaseTcpTransport,
    IntermediatePacketCodec,
    MtArgumentError,
    tl,
    TransportState,
} from '@mtcute/core'

/**
 * An error has occurred while connecting to an SOCKS proxy
 */
export class SocksProxyConnectionError extends Error {
    readonly proxy: SocksProxySettings

    constructor(proxy: SocksProxySettings, message: string) {
        super(
            `Error while connecting to ${proxy.host}:${proxy.port}: ${message}`,
        )
        this.proxy = proxy
    }
}

/**
 * Settings for a SOCKS4/5 proxy
 */
export interface SocksProxySettings {
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
     * Version of the SOCKS proxy (4 or 5)
     *
     * @default `5`
     */
    version?: 4 | 5
}

function writeIpv4(ip: string, buf: Buffer, offset: number): void {
    const parts = ip.split('.')

    if (parts.length !== 4) {
        throw new MtArgumentError('Invalid IPv4 address')
    }
    for (let i = 0; i < 4; i++) {
        const n = parseInt(parts[i])

        if (isNaN(n) || n < 0 || n > 255) {
            throw new MtArgumentError('Invalid IPv4 address')
        }

        buf[offset + i] = n
    }
}

function buildSocks4ConnectRequest(
    ip: string,
    port: number,
    username = '',
): Buffer {
    const userId = Buffer.from(username)
    const buf = Buffer.alloc(9 + userId.length)

    buf[0] = 0x04 // VER
    buf[1] = 0x01 // CMD = establish a TCP/IP stream connection
    buf.writeUInt16BE(port, 2) // DSTPORT
    writeIpv4(ip, buf, 4) // DSTIP
    userId.copy(buf, 8) // ID
    buf[8 + userId.length] = 0x00 // ID (null-termination)

    return buf
}

function buildSocks5Greeting(authAvailable: boolean): Buffer {
    const buf = Buffer.alloc(authAvailable ? 4 : 3)

    buf[0] = 0x05 // VER

    if (authAvailable) {
        buf[1] = 0x02 // NAUTH
        buf[2] = 0x00 // AUTH[0] = No authentication
        buf[3] = 0x02 // AUTH[1] = Username/password
    } else {
        buf[1] = 0x01 // NAUTH
        buf[2] = 0x00 // AUTH[0] = No authentication
    }

    return buf
}

function buildSocks5Auth(username: string, password: string) {
    const usernameBuf = Buffer.from(username)
    const passwordBuf = Buffer.from(password)

    if (usernameBuf.length > 255) {
        throw new MtArgumentError(
            `Too long username (${usernameBuf.length} > 255)`,
        )
    }
    if (passwordBuf.length > 255) {
        throw new MtArgumentError(
            `Too long password (${passwordBuf.length} > 255)`,
        )
    }

    const buf = Buffer.alloc(3 + usernameBuf.length + passwordBuf.length)
    buf[0] = 0x01 // VER of auth
    buf[1] = usernameBuf.length
    usernameBuf.copy(buf, 2)
    buf[2 + usernameBuf.length] = passwordBuf.length
    passwordBuf.copy(buf, 3 + usernameBuf.length)

    return buf
}

function writeIpv6(ip: string, buf: Buffer, offset: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ip = normalize(ip) as string
    const parts = ip.split(':')

    if (parts.length !== 8) {
        throw new MtArgumentError('Invalid IPv6 address')
    }

    for (let i = 0, j = offset; i < 8; i++, j += 2) {
        const n = parseInt(parts[i])

        if (isNaN(n) || n < 0 || n > 0xffff) {
            throw new MtArgumentError('Invalid IPv6 address')
        }

        buf.writeUInt16BE(n, j)
    }
}

function buildSocks5Connect(ip: string, port: number, ipv6 = false): Buffer {
    const buf = Buffer.alloc(ipv6 ? 22 : 10)

    buf[0] = 0x05 // VER
    buf[1] = 0x01 // CMD = establish a TCP/IP stream connection
    buf[2] = 0x00 // RSV

    if (ipv6) {
        buf[3] = 0x04 // TYPE = IPv6
        writeIpv6(ip, buf, 4) // ADDR
        buf.writeUInt16BE(port, 20) // DSTPORT
    } else {
        buf[3] = 0x01 // TYPE = IPv4
        writeIpv4(ip, buf, 4) // ADDR
        buf.writeUInt16BE(port, 8) // DSTPORT
    }

    return buf
}

const SOCKS4_ERRORS: Record<number, string> = {
    '91': 'Request rejected or failed',
    '92': 'Request failed because client is not running identd',
    '93': "Request failed because client's identd could not confirm the user ID in the request",
}

const SOCKS5_ERRORS: Record<number, string> = {
    '1': 'General failure',
    '2': 'Connection not allowed by ruleset',
    '3': 'Network unreachable',
    '4': 'Host unreachable',
    '5': 'Connection refused by destination host',
    '6': 'TTL expired',
    '7': 'Command not supported / protocol error',
    '8': 'Address type not supported',
}

/**
 * TCP transport that connects via a SOCKS4/5 proxy.
 */
export abstract class BaseSocksTcpTransport extends BaseTcpTransport {
    readonly _proxy: SocksProxySettings

    constructor(proxy: SocksProxySettings) {
        super()

        if (
            proxy.version != null &&
            proxy.version !== 4 &&
            proxy.version !== 5
        ) {
            throw new SocksProxyConnectionError(
                proxy,

                `Invalid SOCKS version: ${proxy.version}`,
            )
        }

        this._proxy = proxy
    }

    connect(dc: tl.RawDcOption): void {
        if (this._state !== TransportState.Idle) {
            throw new MtArgumentError('Transport is not IDLE')
        }

        if (!this.packetCodecInitialized) {
            this._packetCodec.on('error', (err) => this.emit('error', err))
            this._packetCodec.on('packet', (buf) => this.emit('message', buf))
            this.packetCodecInitialized = true
        }

        this._state = TransportState.Connecting
        this._currentDc = dc

        this._socket = connect(
            this._proxy.port,
            this._proxy.host,
            this._onProxyConnected.bind(this),
        )

        this._socket.on('error', this.handleError.bind(this))
        this._socket.on('close', this.close.bind(this))
    }

    private _onProxyConnected() {
        let packetHandler: (msg: Buffer) => void

        if (this._proxy.version === 4) {
            packetHandler = (msg) => {
                if (msg[0] !== 0x04) {
                    // VER, must be 4
                    this._socket!.emit(
                        'error',
                        new SocksProxyConnectionError(
                            this._proxy,
                            `Server returned version ${msg[0]}`,
                        ),
                    )

                    return
                }
                const code = msg[1]

                this.log.debug(
                    '[%s:%d] CONNECT returned code %d',
                    this._proxy.host,
                    this._proxy.port,
                    code,
                )

                if (code === 0x5a) {
                    this._socket!.off('data', packetHandler)
                    this._socket!.on('data', (data) =>
                        this._packetCodec.feed(data),
                    )
                    this.handleConnect()
                } else {
                    const msg =
                        code in SOCKS4_ERRORS ?
                            SOCKS4_ERRORS[code] :
                            `Unknown error code: 0x${code.toString(16)}`
                    this._socket!.emit(
                        'error',
                        new SocksProxyConnectionError(this._proxy, msg),
                    )
                }
            }

            this.log.debug(
                '[%s:%d] connected to proxy, sending CONNECT',
                this._proxy.host,
                this._proxy.port,
            )

            try {
                this._socket!.write(
                    buildSocks4ConnectRequest(
                        this._currentDc!.ipAddress,
                        this._currentDc!.port,
                        this._proxy.user,
                    ),
                )
            } catch (e) {
                this._socket!.emit('error', e)
            }
        } else {
            let state: 'greeting' | 'auth' | 'connect' = 'greeting'

            const sendConnect = () => {
                this.log.debug(
                    '[%s:%d] sending CONNECT',
                    this._proxy.host,
                    this._proxy.port,
                )

                try {
                    this._socket!.write(
                        buildSocks5Connect(
                            this._currentDc!.ipAddress,
                            this._currentDc!.port,
                            this._currentDc!.ipv6,
                        ),
                    )
                    state = 'connect'
                } catch (e) {
                    this._socket!.emit('error', e)
                }
            }

            packetHandler = (msg) => {
                switch (state) {
                    case 'greeting': {
                        if (msg[0] !== 0x05) {
                            // VER, must be 5
                            this._socket!.emit(
                                'error',
                                new SocksProxyConnectionError(
                                    this._proxy,
                                    `Server returned version ${msg[0]}`,
                                ),
                            )

                            return
                        }

                        const chosen = msg[1]

                        this.log.debug(
                            '[%s:%d] GREETING returned auth method %d',
                            this._proxy.host,
                            this._proxy.port,
                            chosen,
                        )

                        switch (chosen) {
                            case 0x00:
                                // "No authentication"
                                sendConnect()
                                break
                            case 0x02:
                                // Username/password
                                if (
                                    !this._proxy.user ||
                                    !this._proxy.password
                                ) {
                                    // should not happen
                                    this._socket!.emit(
                                        'error',
                                        new SocksProxyConnectionError(
                                            this._proxy,
                                            'Authentication is required, but not provided',
                                        ),
                                    )
                                    break
                                }

                                try {
                                    this._socket!.write(
                                        buildSocks5Auth(
                                            this._proxy.user,
                                            this._proxy.password,
                                        ),
                                    )
                                    state = 'auth'
                                } catch (e) {
                                    this._socket!.emit('error', e)
                                }
                                break
                            case 0xff:
                            default:
                                // "no acceptable methods were offered"
                                this._socket!.emit(
                                    'error',
                                    new SocksProxyConnectionError(
                                        this._proxy,
                                        'Authentication is required, but not provided/supported',
                                    ),
                                )
                                break
                        }

                        break
                    }
                    case 'auth':
                        if (msg[0] !== 0x01) {
                            // VER of auth, must be 1
                            this._socket!.emit(
                                'error',
                                new SocksProxyConnectionError(
                                    this._proxy,
                                    `Server returned version ${msg[0]}`,
                                ),
                            )

                            return
                        }

                        this.log.debug(
                            '[%s:%d] AUTH returned code %d',
                            this._proxy.host,
                            this._proxy.port,
                            msg[1],
                        )

                        if (msg[1] === 0x00) {
                            // success
                            sendConnect()
                        } else {
                            this._socket!.emit(
                                'error',
                                new SocksProxyConnectionError(
                                    this._proxy,
                                    'Authentication failure',
                                ),
                            )
                        }
                        break

                    case 'connect': {
                        if (msg[0] !== 0x05) {
                            // VER, must be 5
                            this._socket!.emit(
                                'error',
                                new SocksProxyConnectionError(
                                    this._proxy,
                                    `Server returned version ${msg[0]}`,
                                ),
                            )

                            return
                        }

                        const code = msg[1]

                        this.log.debug(
                            '[%s:%d] CONNECT returned code %d',
                            this._proxy.host,
                            this._proxy.port,
                            code,
                        )

                        if (code === 0x00) {
                            // Request granted
                            this._socket!.off('data', packetHandler)
                            this._socket!.on('data', (data) =>
                                this._packetCodec.feed(data),
                            )
                            this.handleConnect()
                        } else {
                            const msg =
                                code in SOCKS5_ERRORS ?
                                    SOCKS5_ERRORS[code] :
                                    `Unknown error code: 0x${code.toString(
                                        16,
                                    )}`
                            this._socket!.emit(
                                'error',
                                new SocksProxyConnectionError(this._proxy, msg),
                            )
                        }
                        break
                    }
                    default:
                        assertNever(state)
                }
            }

            this.log.debug(
                '[%s:%d] connected to proxy, sending GREETING',
                this._proxy.host,
                this._proxy.port,
            )

            try {
                this._socket!.write(
                    buildSocks5Greeting(
                        Boolean(this._proxy.user && this._proxy.password),
                    ),
                )
            } catch (e) {
                this._socket!.emit('error', e)
            }
        }

        this._socket!.on('data', packetHandler)
    }
}

/**
 * Socks TCP transport using an intermediate packet codec.
 *
 * Should be the one passed as `transport` to {@link TelegramClient} constructor
 * (unless you want to use a custom codec).
 */
export class SocksTcpTransport extends BaseSocksTcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
