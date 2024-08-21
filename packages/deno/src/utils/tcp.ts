import EventEmitter from 'node:events'

import type { IPacketCodec, ITelegramTransport } from '@mtcute/core'
import { IntermediatePacketCodec, MtcuteError, TransportState } from '@mtcute/core'
import type { BasicDcOption, ICryptoProvider, Logger } from '@mtcute/core/utils.js'
import { writeAll } from '@std/io/write-all'

/**
 * Base for TCP transports.
 * Subclasses must provide packet codec in `_packetCodec` property
 */
export abstract class BaseTcpTransport extends EventEmitter implements ITelegramTransport {
    protected _currentDc: BasicDcOption | null = null
    protected _state: TransportState = TransportState.Idle
    protected _socket: Deno.TcpConn | null = null

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

        Deno.connect({
            hostname: dc.ipAddress,
            port: dc.port,
            transport: 'tcp',
        })
            .then(this.handleConnect.bind(this))
            .catch((err) => {
                this.handleError(err)
                this.close()
            })
    }

    close(): void {
        if (this._state === TransportState.Idle) return
        this.log.info('connection closed')

        this._state = TransportState.Idle

        try {
            this._socket?.close()
        } catch (e) {
            if (!(e instanceof Deno.errors.BadResource)) {
                this.handleError(e)
            }
        }

        this._socket = null
        this._currentDc = null
        this._packetCodec.reset()
        this.emit('close')
    }

    handleError(error: unknown): void {
        this.log.error('error: %s', error)

        if (this.listenerCount('error') > 0) {
            this.emit('error', error)
        }
    }

    async handleConnect(socket: Deno.TcpConn): Promise<void> {
        this._socket = socket
        this.log.info('connected')

        try {
            const packet = await this._packetCodec.tag()

            if (packet.length) {
                await writeAll(this._socket, packet)
            }

            this._state = TransportState.Ready
            this.emit('ready')

            const reader = this._socket.readable.getReader()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                this._packetCodec.feed(value)
            }
        } catch (e) {
            this.handleError(e)
        }

        this.close()
    }

    async send(bytes: Uint8Array): Promise<void> {
        const framed = await this._packetCodec.encode(bytes)

        if (this._state !== TransportState.Ready) {
            throw new MtcuteError('Transport is not READY')
        }

        await writeAll(this._socket!, framed)
    }
}

export class TcpTransport extends BaseTcpTransport {
    _packetCodec: IntermediatePacketCodec = new IntermediatePacketCodec()
}
