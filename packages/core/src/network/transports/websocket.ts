import type WebSocket from 'ws'
import EventEmitter from 'events'
import { tl } from '@mtcute/tl'

import { typedArrayToBuffer, Logger, ICryptoProvider } from '../../utils'
import { ITelegramTransport, IPacketCodec, TransportState } from './abstract'
import { IntermediatePacketCodec } from './intermediate'
import { ObfuscatedPacketCodec } from './obfuscated'

let ws: {
    new (address: string, options?: string): WebSocket
} | null
if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
    try {
        ws = require('ws')
    } catch (e) {
        ws = null
    }
} else {
    ws = window.WebSocket as any
}

const subdomainsMap: Record<string, string> = {
    1: 'pluto',
    2: 'venus',
    3: 'aurora',
    4: 'vesta',
    5: 'flora',
}

/**
 * Base for WebSocket transports.
 * Subclasses must provide packet codec in `_packetCodec` property
 */
export abstract class BaseWebSocketTransport
    extends EventEmitter
    implements ITelegramTransport
{
    private _currentDc: tl.RawDcOption | null = null
    private _state: TransportState = TransportState.Idle
    private _socket: WebSocket | null = null
    private _crypto!: ICryptoProvider
    protected log!: Logger

    abstract _packetCodec: IPacketCodec
    packetCodecInitialized = false

    private _baseDomain: string
    private _subdomains: Record<string, string>

    /**
     * @param baseDomain  Base WebSocket domain
     * @param subdomains  Map of sub-domains (key is DC ID, value is string)
     */
    constructor(baseDomain = 'web.telegram.org', subdomains = subdomainsMap) {
        super()

        if (!ws)
            throw new Error(
                'To use WebSocket transport with NodeJS, install `ws` package.'
            )

        this._baseDomain = baseDomain
        this._subdomains = subdomains

        this.close = this.close.bind(this)
    }

    private _updateLogPrefix() {
        if (this._currentDc) {
            this.log.prefix = `[WS:${this._subdomains[this._currentDc.id]}.${
                this._baseDomain
            }] `
        } else {
            this.log.prefix = '[WS:disconnected] '
        }
    }

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this.log = log.create('ws')
    }

    state(): TransportState {
        return this._state
    }

    currentDc(): tl.RawDcOption | null {
        return this._currentDc
    }

    connect(dc: tl.RawDcOption, testMode: boolean): void {
        if (this._state !== TransportState.Idle)
            throw new Error('Transport is not IDLE')

        if (!this.packetCodecInitialized) {
            this._packetCodec.setup?.(this._crypto, this.log)
            this._packetCodec.on('error', (err) => this.emit('error', err))
            this._packetCodec.on('packet', (buf) => this.emit('message', buf))
            this.packetCodecInitialized = true
        }

        this._state = TransportState.Connecting
        this._currentDc = dc
        this._socket = new ws!(
            `wss://${this._subdomains[dc.id]}.${this._baseDomain}/apiws${
                testMode ? '_test' : ''
            }`,
            'binary'
        )

        this._updateLogPrefix()
        this.log.debug('connecting to %s (%j)', this._socket.url, dc)

        this._socket.binaryType = 'arraybuffer'

        this._socket.addEventListener('message', (evt) =>
            this._packetCodec.feed(typedArrayToBuffer(evt.data))
        )
        this._socket.addEventListener('open', this.handleConnect.bind(this))
        this._socket.addEventListener('error', this.handleError.bind(this))
        this._socket.addEventListener('close', this.close)
    }

    close(): void {
        if (this._state === TransportState.Idle) return
        this.log.info('close')

        this.emit('connection closed')
        this._state = TransportState.Idle
        this._socket!.removeEventListener('close', this.close)
        this._socket!.close()
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
    }

    async handleError({ error }: { error: Error }): Promise<void> {
        this.log.error('error: %s', error.stack)
        this.emit('error', error)
    }

    async handleConnect(): Promise<void> {
        this.log.info('connected')
        const initialMessage = await this._packetCodec.tag()

        this._socket!.send(initialMessage)
        this._state = TransportState.Ready
        this.emit('ready')
    }

    async send(bytes: Buffer): Promise<void> {
        if (this._state !== TransportState.Ready)
            throw new Error('Transport is not READY')

        const framed = await this._packetCodec.encode(bytes)

        this._socket!.send(framed)
    }
}

export class WebSocketTransport extends BaseWebSocketTransport {
    _packetCodec = new ObfuscatedPacketCodec(new IntermediatePacketCodec())
}
