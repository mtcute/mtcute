import {
    IntermediatePacketCodec,
    ObfuscatedPacketCodec,
    IPacketCodec,
    PaddedIntermediatePacketCodec,
    parseUrlSafeBase64,
    BaseTcpTransport,
    TransportState,
} from '@mtcute/core'
import { tl } from '@mtcute/tl'
import { connect } from 'net'
import { FakeTlsPacketCodec, generateFakeTlsHeader } from './fake-tls'

export interface MtProxySettings {
    /**
     * Host or IP of the proxy (e.g. `proxy.example.com`, `1.2.3.4`)
     */
    host: string

    /**
     * Port of the proxy (e.g. `8888`)
     */
    port: number

    /**
     * Secret of the proxy, optionally encoded either as hex or base64
     */
    secret: string | Buffer
}

const MAX_DOMAIN_LENGTH = 182 // must be small enough not to overflow TLS-hello length
const TLS_START = [
    Buffer.from('160303', 'hex'),
    Buffer.from('140303000101170303', 'hex'),
]

/**
 * TCP transport that connects via an MTProxy
 */
export class MtProxyTcpTransport extends BaseTcpTransport {
    readonly _proxy: MtProxySettings

    private _rawSecret: Buffer
    private _randomPadding = false
    private _fakeTlsDomain: string | null = null
    private _test: boolean

    /**
     * @param proxy  Information about the proxy
     * @param test  Whether test servers should be used
     */
    constructor(proxy: MtProxySettings, test = false) {
        super()

        this._test = test
        this._proxy = proxy

        // validate and parse secret
        let secret: Buffer
        if (Buffer.isBuffer(proxy.secret)) {
            secret = proxy.secret
        } else if (proxy.secret.match(/^[0-9a-f]+$/i)) {
            secret = Buffer.from(proxy.secret, 'hex')
        } else {
            secret = parseUrlSafeBase64(proxy.secret)
        }

        if (secret.length > 17 + MAX_DOMAIN_LENGTH) {
            throw new Error('Invalid secret: too long')
        }

        if (secret.length < 16) {
            throw new Error('Invalid secret: too short')
        }

        if (secret.length === 16) {
            this._rawSecret = secret
        } else if (secret.length === 17 && secret[0] === 0xdd) {
            this._rawSecret = secret.slice(1)
            this._randomPadding = true
        } else if (secret.length >= 18 && secret[0] === 0xee) {
            this._rawSecret = secret.slice(1, 17)
            this._fakeTlsDomain = secret.slice(17).toString()
        } else {
            throw new Error('Unsupported secret')
        }
    }

    _packetCodec!: IPacketCodec

    connect(dc: tl.RawDcOption): void {
        if (this._state !== TransportState.Idle)
            throw new Error('Transport is not IDLE')

        if (this._packetCodec && this._currentDc?.id !== dc.id) {
            // dc changed, thus the codec's init will change too
            // clean up to avoid memory leaks
            this.packetCodecInitialized = false
            this._packetCodec.reset()
            this._packetCodec.removeAllListeners()
            delete (this as any)._packetCodec
        }

        if (!this._packetCodec) {
            const proxy = {
                dcId: dc.id,
                media: dc.mediaOnly!,
                test: this._test,
                secret: this._rawSecret,
            }

            if (!this._fakeTlsDomain) {
                let inner: IPacketCodec
                if (this._randomPadding) {
                    inner = new PaddedIntermediatePacketCodec()
                } else {
                    inner = new IntermediatePacketCodec()
                }

                this._packetCodec = new ObfuscatedPacketCodec(inner, proxy)
            } else {
                this._packetCodec = new FakeTlsPacketCodec(
                    new ObfuscatedPacketCodec(
                        new PaddedIntermediatePacketCodec(),
                        proxy
                    )
                )
            }

            this._packetCodec.setupCrypto?.(this._crypto)
            this._packetCodec.on('error', (err) => this.emit('error', err))
            this._packetCodec.on('packet', (buf) => this.emit('message', buf))
        }

        this._state = TransportState.Connecting
        this._currentDc = dc

        if (this._fakeTlsDomain) {
            this._socket = connect(
                this._proxy.port,
                this._proxy.host,
                this._handleConnectFakeTls.bind(this)
            )
        } else {
            this._socket = connect(
                this._proxy.port,
                this._proxy.host,
                this.handleConnect.bind(this)
            )
            this._socket.on('data', (data) => this._packetCodec.feed(data))
        }
        this._socket.on('error', this.handleError.bind(this))
        this._socket.on('close', this.close.bind(this))
    }

    private async _handleConnectFakeTls(): Promise<void> {
        try {
            const hello = await generateFakeTlsHeader(
                this._fakeTlsDomain!,
                this._rawSecret,
                this._crypto
            )
            const helloRand = hello.slice(11, 11 + 32)

            const checkHelloResponse = async (buf: Buffer): Promise<void> => {
                const resp = buf
                for (const first of TLS_START) {
                    if (buf.length < first.length + 2) {
                        return
                    }

                    if (first.compare(first, 0, first.length) !== 0) {
                        throw new Error(
                            'First part of hello response is invalid'
                        )
                    }
                    buf = buf.slice(first.length)

                    const skipSize = buf.readUInt16BE()
                    buf = buf.slice(2)
                    if (buf.length < skipSize) {
                        return
                    }

                    buf = buf.slice(skipSize)
                }

                const respRand = resp.slice(11, 11 + 32)
                const hash = await this._crypto.hmacSha256(
                    Buffer.concat([
                        helloRand,
                        resp.slice(0, 11),
                        Buffer.alloc(32, 0),
                        resp.slice(11 + 32),
                    ]),
                    this._rawSecret
                )

                if (hash.compare(respRand) !== 0) {
                    throw new Error('Response hash is invalid')
                }
            }

            const packetHandler = async (buf: Buffer): Promise<void> => {
                try {
                    await checkHelloResponse(buf)

                    this._socket!.on('data', (data) =>
                        this._packetCodec.feed(data)
                    )
                    this._socket!.off('data', packetHandler)
                    this.handleConnect()
                } catch (e) {
                    this._socket!.emit('error', e)
                }
            }

            this._socket!.write(hello)
            this._socket!.on('data', packetHandler)
        } catch (e) {
            this._socket!.emit('error', e)
        }
    }
}
