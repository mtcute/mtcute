import EventEmitter from 'events'
import { connect, Socket } from 'net'

import { IntermediatePacketCodec, IPacketCodec, ITelegramTransport, MtcuteError, TransportState } from '@mtcute/core'
import { BasicDcOption, ICryptoProvider, Logger } from '@mtcute/core/utils.js'

/**
 * Base for TCP transports.
 * Subclasses must provide packet codec in `_packetCodec` property
 */
export abstract class BaseTcpTransport extends EventEmitter implements ITelegramTransport {
    protected _currentDc: BasicDcOption | null = null
    protected _state: TransportState = TransportState.Idle
    protected _socket: Socket | null = null

    abstract _packetCodec: IPacketCodec
    protected _crypto!: ICryptoProvider
    protected log!: Logger

    packetCodecInitialized = false

    private _updateLogPrefix() {
        if (this._currentDc) {
            this.log.prefix = `[TCP:${this._currentDc.ipAddress}:${this._currentDc.port}] `
        } else {
            this.log.prefix = '[TCP:disconnected] '
        }
    }

    setup(crypto: ICryptoProvider, log: Logger): void {
        this._crypto = crypto
        this.log = log.create('tcp')
        this._updateLogPrefix()
    }

    state(): TransportState {
        return this._state
    }

    currentDc(): BasicDcOption | null {
        return this._currentDc
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        this._updateLogPrefix()

        this.log.debug('connecting to %j', dc)

        this._socket = connect(dc.port, dc.ipAddress, this.handleConnect.bind(this))

        this._socket.on('data', (data) => {
            this._packetCodec.feed(data)
        })
        this._socket.on('error', this.handleError.bind(this))
        this._socket.on('close', this.close.bind(this))
    }

    close(): void {
        if (this._state === TransportState.Idle) return
        this.log.info('connection closed')

        this.emit('close')
        this._state = TransportState.Idle
        this._socket!.removeAllListeners()
        this._socket!.destroy()
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
    }

    handleError(error: Error): void {
        this.log.error('error: %s', error.stack)
        this.emit('error', error)
    }

    handleConnect(): void {
        this.log.info('connected')

        Promise.resolve(this._packetCodec.tag())
            .then((initialMessage) => {
                if (initialMessage.length) {
                    this._socket!.write(initialMessage, (err) => {
                        if (err) {
                            this.log.error('failed to write initial message: %s', err.stack)
                            this.emit('error')
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
            })
            .catch((err) => this.emit('error', err))
    }

    async send(bytes: Uint8Array): Promise<void> {
        const framed = await this._packetCodec.encode(bytes)

        if (this._state !== TransportState.Ready) {
            throw new MtcuteError('Transport is not READY')
        }

        return new Promise((resolve, reject) => {
            this._socket!.write(framed, (error) => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }
}

export class TcpTransport extends BaseTcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
