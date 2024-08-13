import EventEmitter from 'node:events'

import type { Socket } from 'bun'
import type { IPacketCodec, ITelegramTransport } from '@mtcute/core'
import { IntermediatePacketCodec, MtcuteError, TransportState } from '@mtcute/core'
import type { BasicDcOption, ICryptoProvider, Logger } from '@mtcute/core/utils.js'

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

    // eslint-disable-next-line unused-imports/no-unused-vars
    connect(dc: BasicDcOption, testMode: boolean): void {
        if (this._state !== TransportState.Idle) {
            throw new MtcuteError('Transport is not IDLE')
        }

        if (!this.packetCodecInitialized) {
            this._packetCodec.setup?.(this._crypto, this.log)
            this._packetCodec.on('error', err => this.emit('error', err))
            this._packetCodec.on('packet', buf => this.emit('message', buf))
            this.packetCodecInitialized = true
        }

        this._state = TransportState.Connecting
        this._currentDc = dc
        this._updateLogPrefix()

        this.log.debug('connecting to %j', dc)

        Bun.connect({
            hostname: dc.ipAddress,
            port: dc.port,
            socket: {
                open: this.handleConnect.bind(this),
                error: this.handleError.bind(this),
                data: (socket, data) => this._packetCodec.feed(data),
                close: this.close.bind(this),
                drain: this.handleDrained.bind(this),
            },
        }).catch((err) => {
            this.handleError(null, err as Error)
            this.close()
        })
    }

    close(): void {
        if (this._state === TransportState.Idle) return
        this.log.info('connection closed')

        this._state = TransportState.Idle
        this._socket?.end()
        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
        this._sendOnceDrained = []
        this.emit('close')
    }

    handleError(socket: unknown, error: Error): void {
        this.log.error('error: %s', error.stack)

        if (this.listenerCount('error') > 0) {
            this.emit('error', error)
        }
    }

    handleConnect(socket: Socket): void {
        this._socket = socket
        this.log.info('connected')

        Promise.resolve(this._packetCodec.tag())
            .then((initialMessage) => {
                if (initialMessage.length) {
                    this._socket!.write(initialMessage)
                    this._state = TransportState.Ready
                    this.emit('ready')
                } else {
                    this._state = TransportState.Ready
                    this.emit('ready')
                }
            })
            .catch((err) => {
                if (this.listenerCount('error') > 0) {
                    this.emit('error', err)
                }
            })
    }

    async send(bytes: Uint8Array): Promise<void> {
        const framed = await this._packetCodec.encode(bytes)

        if (this._state !== TransportState.Ready) {
            throw new MtcuteError('Transport is not READY')
        }

        const written = this._socket!.write(framed)

        if (written < framed.length) {
            this._sendOnceDrained.push(framed.subarray(written))
        }
    }

    private _sendOnceDrained: Uint8Array[] = []
    private handleDrained(): void {
        while (this._sendOnceDrained.length) {
            const data = this._sendOnceDrained.shift()!
            const written = this._socket!.write(data)

            if (written < data.length) {
                this._sendOnceDrained.unshift(data.subarray(written))
                break
            }
        }
    }
}

export class TcpTransport extends BaseTcpTransport {
    _packetCodec = new IntermediatePacketCodec()
}
