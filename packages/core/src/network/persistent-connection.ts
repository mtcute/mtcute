import EventEmitter from 'events'
import { ITelegramTransport, TransportFactory, TransportState } from './transports'
import { tl } from '@mtcute/tl'
import { ReconnectionStrategy } from './reconnection'
import {
    ControllablePromise,
    createControllablePromise,
} from '../utils/controllable-promise'
import { ICryptoProvider } from '../utils/crypto'
import { Logger } from '../utils/logger'

export interface PersistentConnectionParams {
    crypto: ICryptoProvider
    transportFactory: TransportFactory
    dc: tl.RawDcOption
    testMode: boolean
    reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>
    inactivityTimeout?: number
}

/**
 * Base class for persistent connections.
 * Only used for {@link TelegramConnection} and used as a mean of code splitting.
 */
export abstract class PersistentConnection extends EventEmitter {
    readonly params: PersistentConnectionParams
    private _transport!: ITelegramTransport

    private _sendOnceConnected: Buffer[] = []

    // reconnection
    private _lastError: Error | null = null
    private _consequentFails = 0
    private _previousWait: number | null = null
    private _reconnectionTimeout: NodeJS.Timeout | null = null

    // inactivity timeout
    private _inactivityTimeout: NodeJS.Timeout | null = null
    private _inactive = false

    // waitForMessage
    private _pendingWaitForMessages: ControllablePromise<Buffer>[] = []

    protected _destroyed = false
    protected _usable = false

    protected abstract onConnected(): void

    protected abstract onError(err: Error): void

    protected abstract onMessage(data: Buffer): void

    protected constructor(params: PersistentConnectionParams, readonly log: Logger) {
        super()
        this.params = params
        this.changeTransport(params.transportFactory)
    }

    changeTransport(factory: TransportFactory): void {
        if (this._transport) {
            this._transport.close()
        }

        this._transport = factory()
        this._transport.setup?.(this.params.crypto, this.log)

        this._transport.on('ready', this.onTransportReady.bind(this))
        this._transport.on('message', this.onTransportMessage.bind(this))
        this._transport.on('error', this.onTransportError.bind(this))
        this._transport.on('close', this.onTransportClose.bind(this))
    }

    onTransportReady(): void {
        // transport ready does not mean actual mtproto is ready

        if (this._sendOnceConnected.length) {
            this._transport.send(Buffer.concat(this._sendOnceConnected))
        }
        this._sendOnceConnected = []
        this.onConnected()
    }

    protected onConnectionUsable(): void {
        const isReconnection = this._consequentFails > 0

        // reset reconnection related state
        this._lastError = null
        this._consequentFails = 0
        this._previousWait = null
        this._usable = true
        this.emit('usable', isReconnection)
        this._rescheduleInactivity()
    }

    onTransportError(err: Error): void {
        if (this._pendingWaitForMessages.length) {
            this._pendingWaitForMessages.shift()!.reject(err)
            return
        }

        this._lastError = err
        this.onError(err)
        // transport is expected to emit `close` after `error`
    }

    onTransportMessage(data: Buffer): void {
        if (this._pendingWaitForMessages.length) {
            this._pendingWaitForMessages.shift()!.resolve(data)
            return
        }

        this.onMessage(data)
    }

    onTransportClose(): void {
        Object.values(this._pendingWaitForMessages).forEach((prom) =>
            prom.reject(new Error('Connection closed'))
        )

        // transport closed because of inactivity
        // obviously we dont want to reconnect then
        if (this._inactive) return

        this._consequentFails += 1

        const wait = this.params.reconnectionStrategy(
            this.params,
            this._lastError,
            this._consequentFails,
            this._previousWait
        )
        if (wait === false) return this.destroy()

        this.emit('wait', wait)

        this._previousWait = wait

        if (this._reconnectionTimeout != null)
            clearTimeout(this._reconnectionTimeout)
        this._reconnectionTimeout = setTimeout(() => {
            if (this._destroyed) return
            this._reconnectionTimeout = null
            this.connect()
        }, wait)
    }

    connect(): void {
        if (this._transport.state() !== TransportState.Idle)
            throw new Error('Connection is already opened!')
        if (this._destroyed) throw new Error('Connection is already destroyed!')
        if (this._reconnectionTimeout != null)
            clearTimeout(this._reconnectionTimeout)

        this._inactive = false
        this._transport.connect(this.params.dc, this.params.testMode)
    }

    reconnect(): void {
        this._transport.close()
    }

    destroy(): void {
        if (this._reconnectionTimeout != null)
            clearTimeout(this._reconnectionTimeout)
        if (this._inactivityTimeout != null)
            clearTimeout(this._inactivityTimeout)

        this._transport.close()
        this._transport.removeAllListeners()
        this._destroyed = true
    }

    protected _rescheduleInactivity(): void {
        if (!this.params.inactivityTimeout) return
        if (this._inactivityTimeout) clearTimeout(this._inactivityTimeout)
        this._inactivityTimeout = setTimeout(() => {
            this.log.info(
                'disconnected because of inactivity for %d',
                this.params.inactivityTimeout
            )
            this._inactive = true
            this._inactivityTimeout = null
            this._transport.close()
        }, this.params.inactivityTimeout)
    }

    async send(data: Buffer): Promise<void> {
        if (this._inactive) {
            this.connect()
        }

        if (this._transport.state() === TransportState.Ready) {
            await this._transport.send(data)
        } else {
            this._sendOnceConnected.push(data)
        }
    }

    waitForNextMessage(): Promise<Buffer> {
        const promise = createControllablePromise<Buffer>()
        this._pendingWaitForMessages.push(promise)

        return promise
    }
}
