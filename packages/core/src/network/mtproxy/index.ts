import type { ITcpConnection, TcpEndpoint } from '@fuman/net'
import type { tl } from '@mtcute/tl'
import type { BasicDcOption, ICryptoProvider, Logger } from '../../utils/index.js'
import type { IPacketCodec, ITelegramConnection, MtProxyInfo, TelegramTransport } from '../transports/index.js'

import { Bytes, read, write } from '@fuman/io'
import { base64, hex, typed, u8 } from '@fuman/utils'
import { MtSecurityError, MtUnsupportedError } from '../../types/errors.js'
import { IntermediatePacketCodec, ObfuscatedPacketCodec, PaddedIntermediatePacketCodec } from '../transports/index.js'

import { FakeTlsPacketCodec, generateFakeTlsHeader } from './_fake-tls.js'

/**
 * MTProto proxy settings
 */
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
    secret: string | Uint8Array
}

const MAX_DOMAIN_LENGTH = 182 // must be small enough not to overflow TLS-hello length
const TLS_START_SERVER = [
    new Uint8Array([0x16, 0x03, 0x03]),
    new Uint8Array([0x14, 0x03, 0x03, 0x00, 0x01, 0x01, 0x17, 0x03, 0x03]),
]
const TLS_START_CLIENT = new Uint8Array([0x14, 0x03, 0x03, 0x00, 0x01, 0x01])

/**
 * Base for a TCP transport that connects via an MTProxy
 */
export abstract class BaseMtProxyTransport implements TelegramTransport {
    abstract _connectTcp(endpoint: TcpEndpoint): Promise<ITcpConnection>
    readonly _proxy: MtProxySettings

    private _rawSecret: Uint8Array
    private _randomPadding = false
    private _fakeTlsDomain: Uint8Array | null = null
    private _crypto!: ICryptoProvider
    private _log!: Logger

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this._log = log.create('mtproxy')
    }

    /**
     * @param proxy  Information about the proxy
     */
    constructor(proxy: MtProxySettings) {
        this._proxy = proxy

        // validate and parse secret
        let secret: Uint8Array

        if (ArrayBuffer.isView(proxy.secret)) {
            secret = proxy.secret
        } else if (proxy.secret.match(/^[0-9a-f]+$/i)) {
            secret = hex.decode(proxy.secret)
        } else {
            secret = base64.decode(proxy.secret, true)
        }

        if (secret.length > 17 + MAX_DOMAIN_LENGTH) {
            throw new MtSecurityError('Invalid secret: too long')
        }

        if (secret.length < 16) {
            throw new MtSecurityError('Invalid secret: too short')
        }

        if (secret.length === 16) {
            this._rawSecret = secret
        } else if (secret.length === 17 && secret[0] === 0xDD) {
            this._rawSecret = secret.slice(1)
            this._randomPadding = true
        } else if (secret.length >= 18 && secret[0] === 0xEE) {
            this._rawSecret = secret.slice(1, 17)
            this._fakeTlsDomain = secret.slice(17)
        } else {
            throw new MtUnsupportedError('Unsupported secret')
        }
    }

    getMtproxyInfo(): tl.RawInputClientProxy {
        return {
            _: 'inputClientProxy',
            address: this._proxy.host,
            port: this._proxy.port,
        }
    }

    packetCodec(dc: BasicDcOption): IPacketCodec {
        const proxy: MtProxyInfo = {
            dcId: dc.id,
            media: Boolean(dc.mediaOnly),
            test: Boolean(dc.testMode),
            secret: this._rawSecret,
        }

        if (!this._fakeTlsDomain) {
            let inner: IPacketCodec

            if (this._randomPadding) {
                inner = new PaddedIntermediatePacketCodec()
            } else {
                inner = new IntermediatePacketCodec()
            }

            return new ObfuscatedPacketCodec(inner, proxy)
        }

        return new FakeTlsPacketCodec(
            new ObfuscatedPacketCodec(new PaddedIntermediatePacketCodec(), proxy),
        )
    }

    async connect(): Promise<ITelegramConnection> {
        const conn = await this._connectTcp({
            address: this._proxy.host,
            port: this._proxy.port,
        })

        if (this._fakeTlsDomain) {
            await this._handleConnectFakeTls(conn)
        }

        return conn
    }

    private async _handleConnectFakeTls(conn: ITcpConnection): Promise<void> {
        this._log.debug('performing initial faketls handshake')
        const hello = await generateFakeTlsHeader(this._fakeTlsDomain!, this._rawSecret, this._crypto)
        const helloRand = hello.slice(11, 11 + 32)

        await conn.write(hello)

        const resp = Bytes.alloc(0)

        for (const first of TLS_START_SERVER) {
            const buf = await read.async.exactly(conn, first.length + 2)
            write.bytes(resp, buf)

            if (!typed.equal(buf.slice(0, first.length), first)) {
                throw new MtSecurityError('Server hello is invalid')
            }

            const skipSize = typed.toDataView(buf).getUint16(first.length)

            write.bytes(resp, await read.async.exactly(conn, skipSize))
        }

        const respBuf = resp.result()
        const respRand = respBuf.slice(11, 11 + 32)
        const hash = await this._crypto.hmacSha256(
            u8.concat([
                helloRand,
                respBuf.slice(0, 11),
                u8.alloc(32),
                respBuf.slice(11 + 32),
            ]),
            this._rawSecret,
        )

        if (!typed.equal(hash, respRand)) {
            throw new MtSecurityError('Response hash is invalid')
        }

        await conn.write(TLS_START_CLIENT)

        this._log.debug('faketls handshake done')
    }
}
