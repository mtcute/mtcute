import EventEmitter from 'events'

import { MtcuteError } from '../types/index.js'
import { BasicDcOption, ICryptoProvider, Logger } from '../utils/index.js'
import { ReconnectionStrategy } from './reconnection.js'
import { ITelegramTransport, TransportFactory, TransportState } from './transports/index.js'

export interface PersistentConnectionParams {
    crypto: ICryptoProvider
    transportFactory: TransportFactory
    dc: BasicDcOption
    testMode: boolean
    reconnectionStrategy: ReconnectionStrategy<PersistentConnectionParams>
    inactivityTimeout?: number
}

let nextConnectionUid = 0

/**
 * Base class for persistent connections.
 * Only used for {@link PersistentConnection} and used as a mean of code splitting.
 * This class doesn't know anything about MTProto, it just manages the transport.
 */
export abstract class PersistentConnection extends EventEmitter {
    private _uid = nextConnectionUid++

    readonly params: PersistentConnectionParams
    protected _transport!: ITelegramTransport

    private _sendOnceConnected: Uint8Array[] = []

    // reconnection
    private _lastError: Error | null = null
    private _consequentFails = 0
    private _previousWait: number | null = null
    private _reconnectionTimeout: NodeJS.Timeout | null = null
    private _shouldReconnectImmediately = false
    protected _disconnectedManually = false

    // inactivity timeout
    private _inactivityTimeout: NodeJS.Timeout | null = null
    private _inactive = true

    _destroyed = false
    _usable = false

    protected abstract onConnected(): void

    protected abstract onError(err: Error): void

    protected abstract onMessage(data: Uint8Array): void

    protected constructor(
        params: PersistentConnectionParams,
        readonly log: Logger,
    ) {
        super()
        this.params = params
        this.changeTransport(params.transportFactory)

        this.log.prefix = `[UID ${this._uid}] `

        this._onInactivityTimeout = this._onInactivityTimeout.bind(this)
    }

    get isConnected(): boolean {
        return this._transport.state() !== TransportState.Idle
    }

    changeTransport(factory: TransportFactory): void {
        if (this._transport) {
            Promise.resolve(this._transport.close()).catch((err) => {
                this.log.warn('error closing previous transport: %s', err)
            })
        }

        this._transport = factory()
        this._transport.setup?.(this.params.crypto, this.log)

        this._transport.on('ready', this.onTransportReady.bind(this))
        this._transport.on('message', this.onMessage.bind(this))
        this._transport.on('error', this.onTransportError.bind(this))
        this._transport.on('close', this.onTransportClose.bind(this))
    }

    onTransportReady(): void {
        // transport ready does not mean actual mtproto is ready
        if (this._sendOnceConnected.length) {
            const sendNext = () => {
                if (!this._sendOnceConnected.length) {
                    this.onConnected()

                    return
                }

                const data = this._sendOnceConnected.shift()!
                this._transport
                    .send(data)
                    .then(sendNext)
                    .catch((err) => {
                        this.log.error('error sending queued data: %s', err)
                        this._sendOnceConnected.unshift(data)
                    })
            }

            sendNext()

            return
        }

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
        this._lastError = err
        this.onError(err)
        // transport is expected to emit `close` after `error`
    }

    onTransportClose(): void {
        // transport closed because of inactivity
        // obviously we dont want to reconnect then
        if (this._inactive || this._disconnectedManually) return

        if (this._shouldReconnectImmediately) {
            this._shouldReconnectImmediately = false
            this.connect()

            return
        }

        this._consequentFails += 1

        const wait = this.params.reconnectionStrategy(
            this.params,
            this._lastError,
            this._consequentFails,
            this._previousWait,
        )

        if (wait === false) {
            this.destroy().catch((err) => {
                this.log.warn('error destroying connection: %s', err)
            })

            return
        }

        this.emit('wait', wait)

        this._previousWait = wait

        if (this._reconnectionTimeout != null) {
            clearTimeout(this._reconnectionTimeout)
        }
        this._reconnectionTimeout = setTimeout(() => {
            if (this._destroyed) return
            this._reconnectionTimeout = null
            this.connect()
        }, wait)
    }

    connect(): void {
        if (this.isConnected) {
            throw new MtcuteError('Connection is already opened!')
        }
        if (this._destroyed) {
            throw new MtcuteError('Connection is already destroyed!')
        }

        if (this._reconnectionTimeout != null) {
            clearTimeout(this._reconnectionTimeout)
            this._reconnectionTimeout = null
        }

        this._inactive = false
        this._disconnectedManually = false
        this._transport.connect(this.params.dc, this.params.testMode)
    }

    reconnect(): void {
        if (this._inactive) return

        // if we are already connected
        if (this.isConnected) {
            this._shouldReconnectImmediately = true
            Promise.resolve(this._transport.close()).catch((err) => {
                this.log.error('error closing transport: %s', err)
            })

            return
        }

        // if reconnection timeout is pending, it will be cancelled in connect()
        this.connect()
    }

    async disconnectManual(): Promise<void> {
        this._disconnectedManually = true
        await this._transport.close()
    }

    async destroy(): Promise<void> {
        if (this._reconnectionTimeout != null) {
            clearTimeout(this._reconnectionTimeout)
        }
        if (this._inactivityTimeout != null) {
            clearTimeout(this._inactivityTimeout)
        }

        await this._transport.close()
        this._transport.removeAllListeners()
        this._destroyed = true
    }

    protected _rescheduleInactivity(): void {
        if (!this.params.inactivityTimeout) return
        if (this._inactivityTimeout) clearTimeout(this._inactivityTimeout)
        this._inactivityTimeout = setTimeout(this._onInactivityTimeout, this.params.inactivityTimeout)
    }

    protected _onInactivityTimeout(): void {
        this.log.info('disconnected because of inactivity for %d', this.params.inactivityTimeout)
        this._inactive = true
        this._inactivityTimeout = null
        Promise.resolve(this._transport.close()).catch((err) => {
            this.log.warn('error closing transport: %s', err)
        })
    }

    setInactivityTimeout(timeout?: number): void {
        this.params.inactivityTimeout = timeout

        if (this._inactivityTimeout) {
            clearTimeout(this._inactivityTimeout)
        }

        if (timeout) {
            this._rescheduleInactivity()
        }
    }

    async send(data: Uint8Array): Promise<void> {
        if (this._inactive) {
            this.connect()
        }

        if (this._transport.state() === TransportState.Ready) {
            await this._transport.send(data)
        } else {
            this._sendOnceConnected.push(data)
        }
    }
}
