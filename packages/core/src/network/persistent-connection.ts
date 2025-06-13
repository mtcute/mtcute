import type { ReconnectionStrategy } from '@fuman/net'
import type { tl } from '@mtcute/tl'
import type { BasicDcOption, ICryptoProvider, Logger } from '../utils/index.js'
import type { IPacketCodec, ITelegramConnection, TelegramTransport } from './transports/abstract.js'

import { FramedReader, FramedWriter } from '@fuman/io'

import { ConnectionClosedError, PersistentConnection as FumanPersistentConnection } from '@fuman/net'
import { Emitter, timers } from '@fuman/utils'

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
export abstract class PersistentConnection {
    private _uid = nextConnectionUid++

    readonly params: PersistentConnectionParams

    private _sendOnceConnected: Uint8Array[] = []
    private _codec: IPacketCodec
    private _fuman: FumanPersistentConnection<BasicDcOption, ITelegramConnection>

    // reconnection
    protected _disconnectedManually = false

    // inactivity timeout
    private _inactivityTimeout: timers.Timer | null = null
    _inactive = true
    _destroyed = false
    _usable = false

    readonly onWait: Emitter<number> = new Emitter()
    readonly onUsable: Emitter<void> = new Emitter()
    readonly onError: Emitter<Error> = new Emitter()

    protected abstract onConnected(): void
    protected abstract onClosed(): void
    protected abstract handleError(err: Error): void

    protected abstract onMessage(data: Uint8Array): void

    protected constructor(
        params: PersistentConnectionParams,
        readonly log: Logger,
    ) {
        this.params = params

        this.params.transport.setup?.(this.params.crypto, log)
        this._codec = this.params.transport.packetCodec(params.dc)
        this._codec.setup?.(this.params.crypto, this.log)

        this._onInactivityTimeout = this._onInactivityTimeout.bind(this)
        this._fuman = new FumanPersistentConnection({
            connect: (dc) => {
                this._updateLogPrefix()
                this.log.debug('connecting to %j', dc)
                return params.transport.connect(dc)
            },
            strategy: params.reconnectionStrategy,
            onOpen: this._onOpen.bind(this),
            onClose: this._onClose.bind(this),
            onError: this._onError.bind(this),
            onWait: (wait) => {
                this._updateLogPrefix()
                this.log.debug('waiting for %d ms before reconnecting', wait)
                this.onWait.emit(wait)
            },
        })

        this._updateLogPrefix()
    }

    private _updateLogPrefix() {
        const uidPrefix = `[UID ${this._uid}] `
        if (this._fuman.isConnected) {
            const dc = this.params.dc
            this.log.prefix = `${uidPrefix}[DC ${dc.id} @ ${dc.ipAddress}:${dc.port}] `
        } else if (this._fuman.isConnecting) {
            this.log.prefix = `${uidPrefix}[connecting] `
        } else {
            this.log.prefix = `${uidPrefix}[disconnected] `
        }
    }

    get isConnected(): boolean {
        return this._fuman.isConnected
    }

    private _writer?: FramedWriter

    protected _mtproxyInfo?: tl.RawInputClientProxy

    private async _onOpen(conn: ITelegramConnection) {
        this._updateLogPrefix()
        this.log.debug('connected')

        const tag = await this._codec.tag()
        if (tag) {
            await conn.write(tag)
        }

        this._mtproxyInfo = conn.getMtproxyInfo?.()

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
        this.onUsable.emit() // is this needed?
        this.onConnected()

        while (true) {
            const msg = await reader.read()

            if (msg) {
                this.onMessage(msg)
            }
        }
    }

    private _onClose(): void {
        this.log.debug('connection closed')
        this._updateLogPrefix()

        this._writer = undefined
        this._codec.reset()
        this.onClosed()
    }

    private _onError(err: Error) {
        this._updateLogPrefix()

        if (!(err instanceof ConnectionClosedError)) {
            this.handleError(err)
        }

        return 'reconnect' as const
    }

    async changeTransport(transport: TelegramTransport): Promise<void> {
        await this._fuman.close()

        this._codec = transport.packetCodec(this.params.dc)
        this._codec.setup?.(this.params.crypto, this.log)

        await this._fuman.changeTransport(transport.connect.bind(transport))
        this._fuman.connect(this.params.dc)
    }

    connect(): void {
        this._fuman.connect(this.params.dc)

        this._inactive = false
    }

    reconnect(): void {
        if (this._disconnectedManually) {
            this._disconnectedManually = false
            this.connect()
            return
        }
        this._fuman.reconnect(true)
    }

    async disconnectManual(): Promise<void> {
        if (this._inactivityTimeout) {
            timers.clearTimeout(this._inactivityTimeout)
        }
        this._disconnectedManually = true
        await this._fuman.close()
    }

    async destroy(): Promise<void> {
        if (this._inactivityTimeout) {
            timers.clearTimeout(this._inactivityTimeout)
        }
        this._destroyed = true
        await this._fuman.close()
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
            try {
                await this._writer.write(data)
            } catch (e: unknown) {
                if (!(e instanceof ConnectionClosedError)) {
                    this.log.warn('encountered an error while sending, reconnecting: %e', e)
                    this._writer = undefined
                    this._fuman.reconnect(true)
                    this._sendOnceConnected.push(data)
                }
            }
        } else {
            this._sendOnceConnected.push(data)
        }
    }
}
