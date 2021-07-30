import { ITelegramTransport, IPacketCodec, TransportState } from './abstract'
import { tl } from '@mtqt/tl'
import EventEmitter from 'events'
import { typedArrayToBuffer } from '../../utils/buffer-utils'
import { ICryptoProvider } from '../../utils/crypto'
import type WebSocket from 'ws'
import { IntermediatePacketCodec } from './intermediate'
import { ObfuscatedPacketCodec } from './obfuscated'

const debug = require('debug')('mtqt:ws')

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
    implements ITelegramTransport {
    private _currentDc: tl.RawDcOption | null = null
    private _state: TransportState = TransportState.Idle
    private _socket: WebSocket | null = null
    private _crypto!: ICryptoProvider

    abstract _packetCodec: IPacketCodec
    packetCodecInitialized = false

    private _baseDomain: string
    private _subdomains: Record<string, string>

    /**
     * @param baseDomain  Base WebSocket domain
     * @param subdomains  Map of sub-domains (key is DC ID, value is string)
     */
    constructor(
        baseDomain = 'web.telegram.org',
        subdomains = subdomainsMap
    ) {
        super()

        if (!ws)
            throw new Error(
                'To use WebSocket transport with NodeJS, install `ws` package.'
            )

        this._baseDomain = baseDomain
        this._subdomains = subdomains

        this.close = this.close.bind(this)
    }

    setupCrypto(crypto: ICryptoProvider): void {
        this._crypto = crypto
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
            this._packetCodec.setupCrypto?.(this._crypto)
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
        debug('%s: close', this._currentDc!.ipAddress)

        this.emit('close')
        this._state = TransportState.Idle
        this._socket!.removeEventListener('close', this.close)
        this._socket!.close()
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
    }

    async handleError({ error }: { error: Error }): Promise<void> {
        debug('%s: error: %s', this._currentDc!.ipAddress, error.stack)
        this.emit('error', error)
    }

    async handleConnect(): Promise<void> {
        debug('%s: connected', this._currentDc!.ipAddress)
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
