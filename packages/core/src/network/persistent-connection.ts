// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import type { ReconnectionStrategy } from '@fuman/net'
import { PersistentConnection as FumanPersistentConnection } from '@fuman/net'
import { FramedReader, FramedWriter } from '@fuman/io'

import type { BasicDcOption, ICryptoProvider, Logger } from '../utils/index.js'
import { timers } from '../utils/index.js'

import type { IPacketCodec, ITelegramConnection, TelegramTransport } from './transports/abstract.js'

export interface PersistentConnectionParams {
    crypto: ICryptoProvider
    transport: TelegramTransport
    dc: BasicDcOption
    testMode: boolean
    reconnectionStrategy: ReconnectionStrategy
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
    // protected _transport!: ITelegramConnection

    private _sendOnceConnected: Uint8Array[] = []
    private _codec: IPacketCodec
    private _fuman: FumanPersistentConnection<BasicDcOption, ITelegramConnection>

    // reconnection
    private _lastError: Error | null = null
    private _consequentFails = 0
    private _previousWait: number | null = null
    private _reconnectionTimeout: timers.Timer | null = null
    private _shouldReconnectImmediately = false
    protected _disconnectedManually = false

    // inactivity timeout
    private _inactivityTimeout: timers.Timer | null = null
    private _inactive = true

    _destroyed = false
    _usable = false

    protected abstract onConnected(): void
    protected abstract onClosed(): void

    protected abstract onError(err: Error): void

    protected abstract onMessage(data: Uint8Array): void

    protected constructor(
        params: PersistentConnectionParams,
        readonly log: Logger,
    ) {
        super()
        this.params = params
        this.log.prefix = `[UID ${this._uid}] `

        this._codec = this.params.transport.packetCodec()
        this._codec.setup?.(this.params.crypto, this.log)

        this._onInactivityTimeout = this._onInactivityTimeout.bind(this)
        this._fuman = new FumanPersistentConnection({
            connect: dc => params.transport.connect(dc, params.testMode),
            onOpen: this._onOpen.bind(this),
            onClose: this._onClose.bind(this),
            onError: this._onError.bind(this),
            onWait: wait => this.emit('wait', wait),
        })
    }

    get isConnected(): boolean {
        return this._fuman.isConnected
    }

    private _writer?: FramedWriter

    private async _onOpen(conn: ITelegramConnection) {
        await conn.write(await this._codec.tag())

        const reader = new FramedReader(conn, this._codec)
        this._writer = new FramedWriter(conn, this._codec)

        while (this._sendOnceConnected.length) {
            const data = this._sendOnceConnected.shift()!

            try {
                await this._writer.write(data)
            } catch (e) {
                this._sendOnceConnected.unshift(data)
                throw e
            }
        }

        this._rescheduleInactivity()
        this.emit('usable') // is this needed?
        this.onConnected()

        while (true) {
            const msg = await reader.read()

            if (msg) {
                this.onMessage(msg)
            }
        }
    }

    private async _onClose() {
        this._writer = undefined
        this._codec.reset()
        this.onClosed()
    }

    private async _onError(err: Error) {
        this._lastError = err
        this.onError(err)
    }

    async changeTransport(transport: TelegramTransport): Promise<void> {
        await this._fuman.close()

        this._codec = transport.packetCodec()
        this._codec.setup?.(this.params.crypto, this.log)

        await this._fuman.changeTransport(() => transport.connect(this.params.dc, this.params.testMode))
        this._fuman.connect(this.params.dc)
        // if (this._transport) {
        //     Promise.resolve(this._transport.close()).catch((err) => {
        //         this.log.warn('error closing previous transport: %e', err)
        //     })
        // }

        // this._transport = conn()
        // this._transport.setup?.(this.params.crypto, this.log)

        // this._transport.on('ready', this.onTransportReady.bind(this))
        // this._transport.on('message', this.onMessage.bind(this))
        // this._transport.on('error', this.onTransportError.bind(this))
        // this._transport.on('close', this.onTransportClose.bind(this))
    }

    // onTransportReady(): void {
    //     // transport ready does not mean actual mtproto is ready
    //     if (this._sendOnceConnected.length) {
    //         const sendNext = () => {
    //             if (!this._sendOnceConnected.length) {
    //                 this.onConnected()

    //                 return
    //             }

    //             const data = this._sendOnceConnected.shift()!
    //             this._transport
    //                 .send(data)
    //                 .then(sendNext)
    //                 .catch((err) => {
    //                     this.log.error('error sending queued data: %e', err)
    //                     this._sendOnceConnected.unshift(data)
    //                 })
    //         }

    //         sendNext()

    //         return
    //     }

    //     this.onConnected()
    // }

    // protected onConnectionUsable(): void {
    //     const isReconnection = this._consequentFails > 0

    //     // reset reconnection related state
    //     this._lastError = null
    //     this._consequentFails = 0
    //     this._previousWait = null
    //     this._usable = true
    //     this.emit('usable', isReconnection)
    //     this._rescheduleInactivity()
    // }

    // onTransportError(err: Error): void {

    //     // transport is expected to emit `close` after `error`
    // }

    // onTransportClose(): void {
    //     // transport closed because of inactivity
    //     // obviously we dont want to reconnect then
    //     if (this._inactive || this._disconnectedManually) return

    //     if (this._shouldReconnectImmediately) {
    //         this._shouldReconnectImmediately = false
    //         this.connect()

    //         return
    //     }

    //     this._consequentFails += 1

    //     const wait = this.params.reconnectionStrategy(
    //         this.params,
    //         this._lastError,
    //         this._consequentFails,
    //         this._previousWait,
    //     )

    //     if (wait === false) {
    //         this.destroy().catch((err) => {
    //             this.log.warn('error destroying connection: %e', err)
    //         })

    //         return
    //     }

    //     this._previousWait = wait

    //     if (this._reconnectionTimeout != null) {
    //         timers.clearTimeout(this._reconnectionTimeout)
    //     }
    //     this._reconnectionTimeout = timers.setTimeout(() => {
    //         if (this._destroyed) return
    //         this._reconnectionTimeout = null
    //         this.connect()
    //     }, wait)
    // }

    connect(): void {
        this._fuman.connect(this.params.dc)

        this._inactive = false
        // if (this.isConnected) {
        //     throw new MtcuteError('Connection is already opened!')
        // }
        // if (this._destroyed) {
        //     throw new MtcuteError('Connection is already destroyed!')
        // }

        // if (this._reconnectionTimeout != null) {
        //     clearTimeout(this._reconnectionTimeout)
        //     this._reconnectionTimeout = null
        // }

        // this._inactive = false
        // this._disconnectedManually = false
        // this._transport.connect(this.params.dc, this.params.testMode)
    }

    reconnect(): void {
        // if (this._inactive) return

        // // if we are already connected
        // if (this.isConnected) {
        //     this._shouldReconnectImmediately = true
        //     Promise.resolve(this._transport.close()).catch((err) => {
        //         this.log.error('error closing transport: %e', err)
        //     })

        //     return
        // }

        // // if reconnection timeout is pending, it will be cancelled in connect()
        // this.connect()
        this._fuman.reconnect(true)
    }

    async disconnectManual(): Promise<void> {
        // this._disconnectedManually = true
        // await this._transport.close()
        await this._fuman.close()
    }

    async destroy(): Promise<void> {
        // if (this._reconnectionTimeout != null) {
        //     clearTimeout(this._reconnectionTimeout)
        // }
        // if (this._inactivityTimeout != null) {
        //     clearTimeout(this._inactivityTimeout)
        // }

        await this._fuman.close()
        // this._transport.removeAllListeners()
        // this._destroyed = true
    }

    protected _rescheduleInactivity(): void {
        if (!this.params.inactivityTimeout) return
        if (this._inactivityTimeout) timers.clearTimeout(this._inactivityTimeout)
        this._inactivityTimeout = timers.setTimeout(this._onInactivityTimeout, this.params.inactivityTimeout)
    }

    protected _onInactivityTimeout(): void {
        this.log.info('disconnected because of inactivity for %d', this.params.inactivityTimeout)
        this._inactive = true
        this._inactivityTimeout = null
        Promise.resolve(this._fuman.close()).catch((err) => {
            this.log.warn('error closing transport: %e', err)
        })
    }

    setInactivityTimeout(timeout?: number): void {
        this.params.inactivityTimeout = timeout

        if (this._inactivityTimeout) {
            timers.clearTimeout(this._inactivityTimeout)
        }

        if (timeout) {
            this._rescheduleInactivity()
        }
    }

    async send(data: Uint8Array): Promise<void> {
        if (this._inactive) {
            this.connect()
        }

        if (this._writer) {
            this._rescheduleInactivity()
            await this._writer.write(data)
        } else {
            this._sendOnceConnected.push(data)
        }
    }
}
