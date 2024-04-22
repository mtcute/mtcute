import EventEmitter from 'events'

import {
    IntermediatePacketCodec,
    IPacketCodec,
    ITelegramTransport,
    MtcuteError,
    MtUnsupportedError,
    ObfuscatedPacketCodec,
    TransportState,
} from '@mtcute/core'
import {
    BasicDcOption,
    ControllablePromise,
    createControllablePromise,
    ICryptoProvider,
    Logger,
} from '@mtcute/core/utils.js'

export type WebSocketConstructor = {
    new (address: string, protocol?: string): WebSocket
}

const subdomainsMap: Record<string, string> = {
    '1': 'pluto',
    '2': 'venus',
    '3': 'aurora',
    '4': 'vesta',
    '5': 'flora',
}

/**
 * Base for WebSocket transports.
 * Subclasses must provide packet codec in `_packetCodec` property
 */
export abstract class BaseWebSocketTransport extends EventEmitter implements ITelegramTransport {
    private _currentDc: BasicDcOption | null = null
    private _state: TransportState = TransportState.Idle
    private _socket: WebSocket | null = null
    private _crypto!: ICryptoProvider
    protected log!: Logger

    abstract _packetCodec: IPacketCodec
    packetCodecInitialized = false

    private _baseDomain: string
    private _subdomains: Record<string, string>
    private _WebSocket: WebSocketConstructor

    constructor({
        ws = WebSocket,
        baseDomain = 'web.telegram.org',
        subdomains = subdomainsMap,
    }: {
        /** Custom implementation of WebSocket (e.g. https://npm.im/ws) */
        ws?: WebSocketConstructor
        /** Base WebSocket domain */
        baseDomain?: string
        /** Map of sub-domains (key is DC ID, value is string) */
        subdomains?: Record<string, string>
    } = {}) {
        super()

        if (!ws) {
            throw new MtUnsupportedError(
                'To use WebSocket transport with NodeJS, install `ws` package and pass it to constructor',
            )
        }

        // gotta love cjs/esm compat
        if ('default' in ws) {
            ws = ws.default as WebSocketConstructor
        }

        this._baseDomain = baseDomain
        this._subdomains = subdomains
        this._WebSocket = ws
    }

    private _updateLogPrefix() {
        if (this._currentDc) {
            this.log.prefix = `[WS:${this._subdomains[this._currentDc.id]}.${this._baseDomain}] `
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

    currentDc(): BasicDcOption | null {
        return this._currentDc
    }

    connect(dc: BasicDcOption, testMode: boolean): void {
        if (this._state !== TransportState.Idle) {
            throw new MtcuteError('Transport is not IDLE')
        }

        if (!this.packetCodecInitialized) {
            this._packetCodec.setup?.(this._crypto, this.log)
            this._packetCodec.on('error', (err) => this.emit('error', err))
            this._packetCodec.on('packet', (buf) => this.emit('message', buf))
            this.packetCodecInitialized = true
        }

        this._state = TransportState.Connecting
        this._currentDc = dc
        this._socket = new this._WebSocket(
            `wss://${this._subdomains[dc.id]}.${this._baseDomain}/apiws${testMode ? '_test' : ''}`,
            'binary',
        )

        this._updateLogPrefix()
        this.log.debug('connecting to %s (%j)', this._socket.url, dc)

        this._socket.binaryType = 'arraybuffer'

        this._socket.addEventListener('message', (evt) =>
            this._packetCodec.feed(new Uint8Array(evt.data as ArrayBuffer)),
        )
        this._socket.addEventListener('open', this.handleConnect.bind(this))
        this._socket.addEventListener('error', this.handleError.bind(this))
        this._socket.addEventListener('close', this.handleClosed.bind(this))
    }

    private _closeWaiters: ControllablePromise<void>[] = []
    async close(): Promise<void> {
        if (this._state === TransportState.Idle) return

        const promise = createControllablePromise<void>()
        this._closeWaiters.push(promise)

        this._socket!.close()

        return promise
    }

    handleClosed(): void {
        this.log.info('connection closed')
        this._state = TransportState.Idle
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
        this.emit('close')

        for (const waiter of this._closeWaiters) {
            waiter.resolve()
        }
        this._closeWaiters = []
    }

    handleError(event: Event | { error: Error }): void {
        const error = 'error' in event ? event.error : new Error('unknown WebSocket error')

        this.log.error('error: %s', error.stack)
        this.emit('error', error)
    }

    handleConnect(): void {
        this.log.info('connected')

        Promise.resolve(this._packetCodec.tag())
            .then((initialMessage) => {
                this._socket!.send(initialMessage)
                this._state = TransportState.Ready
                this.emit('ready')
            })
            .catch((err) => this.emit('error', err))
    }

    async send(bytes: Uint8Array): Promise<void> {
        if (this._state !== TransportState.Ready) {
            throw new MtcuteError('Transport is not READY')
        }

        const framed = await this._packetCodec.encode(bytes)

        this._socket!.send(framed)
    }
}

export class WebSocketTransport extends BaseWebSocketTransport {
    _packetCodec = new ObfuscatedPacketCodec(new IntermediatePacketCodec())
}
