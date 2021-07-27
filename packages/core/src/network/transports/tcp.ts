import { ITelegramTransport, IPacketCodec, TransportState } from './abstract'
import { tl } from '@mtqt/tl'
import { Socket, connect } from 'net'
import EventEmitter from 'events'
import { ICryptoProvider } from '../../utils/crypto'
import { IntermediatePacketCodec } from './intermediate'

const debug = require('debug')('mtqt:tcp')

/**
 * Base for TCP transports.
 * Subclasses must provide packet codec in `_packetCodec` property
 */
export abstract class BaseTcpTransport
    extends EventEmitter
    implements ITelegramTransport {
    protected _currentDc: tl.RawDcOption | null = null
    protected _state: TransportState = TransportState.Idle
    protected _socket: Socket | null = null

    abstract _packetCodec: IPacketCodec
    protected _crypto: ICryptoProvider

    packetCodecInitialized = false

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
        this._socket = connect(
            dc.port,
            dc.ipAddress,
            this.handleConnect.bind(this)
        )

        this._socket.on('data', (data) => this._packetCodec.feed(data))
        this._socket.on('error', this.handleError.bind(this))
        this._socket.on('close', this.close.bind(this))
    }

    close(): void {
        if (this._state === TransportState.Idle) return
        debug('%s: close', this._currentDc!.ipAddress)

        this.emit('close')
        this._state = TransportState.Idle
        this._socket!.removeAllListeners()
        this._socket!.destroy()
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
    }

    async handleError(error: Error): Promise<void> {
        debug('%s: error: %s', this._currentDc!.ipAddress, error.stack)
        this.emit('error', error)
    }

    async handleConnect(): Promise<void> {
        debug('%s: connected', this._currentDc!.ipAddress)
        const initialMessage = await this._packetCodec.tag()

        if (initialMessage.length) {
            this._socket!.write(initialMessage, (err) => {
                if (err) {
                    this.emit('error', err)
                    this.close()
                } else {
                    this._state = TransportState.Ready
                    this.emit('ready')
                }
            })
        } else {
            this._state = TransportState.Ready
            this.emit('ready')
        }
    }

    async send(bytes: Buffer): Promise<void> {
        if (this._state !== TransportState.Ready)
            throw new Error('Transport is not READY')

        const framed = await this._packetCodec.encode(bytes)

        return new Promise((res, rej) => {
            this._socket!.write(framed, (err) => (err ? rej(err) : res()))
        })
    }
}

export class TcpTransport extends BaseTcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
