import EventEmitter from 'events'

import { tl } from '@mtcute/tl'

import { createControllablePromise, Logger } from '../utils/index.js'
import { MtprotoSession } from './mtproto-session.js'
import { SessionConnection, SessionConnectionParams } from './session-connection.js'
import { TransportFactory } from './transports/index.js'

export class MultiSessionConnection extends EventEmitter {
    private _log: Logger
    readonly _sessions: MtprotoSession[]
    private _enforcePfs = false

    constructor(
        readonly params: SessionConnectionParams,
        private _count: number,
        log: Logger,
        logPrefix = '',
    ) {
        super()
        this._log = log.create('multi')
        if (logPrefix) this._log.prefix = `[${logPrefix}] `
        this._enforcePfs = _count > 1 && params.isMainConnection

        this._sessions = []
        this._updateConnections()
    }

    protected _connections: SessionConnection[] = []

    setCount(count: number, connect = this.params.isMainConnection): void {
        this._count = count

        this._updateConnections(connect)
    }

    private _updateSessions(): void {
        // there are two cases
        // 1. this msc is main, in which case every connection should have its own session
        // 2. this msc is not main, in which case all connections should share the same session
        // if (!this.params.isMainConnection) {
        //     // case 2
        //     this._log.debug(
        //         'updating sessions count: %d -> 1',
        //         this._sessions.length,
        //     )
        //
        //     if (this._sessions.length === 0) {
        //         this._sessions.push(
        //             new MtprotoSession(
        //                 this.params.crypto,
        //                 this._log.create('session'),
        //                 this.params.readerMap,
        //                 this.params.writerMap,
        //             ),
        //         )
        //     }
        //
        //     // shouldn't happen, but just in case
        //     while (this._sessions.length > 1) {
        //         this._sessions.pop()!.reset()
        //     }
        //
        //     return
        // }

        this._log.debug('updating sessions count: %d -> %d', this._sessions.length, this._count)

        // case 1
        if (this._sessions.length === this._count) return

        if (this._sessions.length > this._count) {
            // destroy extra sessions
            for (let i = this._sessions.length - 1; i >= this._count; i--) {
                this._sessions[i].reset()
            }

            this._sessions.splice(this._count)

            return
        }

        while (this._sessions.length < this._count) {
            const idx = this._sessions.length
            const session = new MtprotoSession(
                this.params.crypto,
                this._log.create('session'),
                this.params.readerMap,
                this.params.writerMap,
                this.params.salts,
            )

            // brvh
            if (idx !== 0) session._authKey = this._sessions[0]._authKey

            this._sessions.push(session)
        }
    }

    private _updateConnections(connect = false): void {
        this._updateSessions()
        if (this._connections.length === this._count) return

        this._log.debug('updating connections count: %d -> %d', this._connections.length, this._count)

        const newEnforcePfs = this._count > 1 && this.params.isMainConnection
        const enforcePfsChanged = newEnforcePfs !== this._enforcePfs

        if (enforcePfsChanged) {
            this._log.debug('enforcePfs changed: %s -> %s', this._enforcePfs, newEnforcePfs)
            this._enforcePfs = newEnforcePfs
        }

        if (this._connections.length > this._count) {
            // destroy extra connections
            for (let i = this._connections.length - 1; i >= this._count; i--) {
                this._connections[i].removeAllListeners()
                this._connections[i].destroy().catch((err) => {
                    this._log.warn('error destroying connection: %s', err)
                })
            }

            this._connections.splice(this._count)

            return
        }

        if (enforcePfsChanged) {
            // we need to fetch new auth keys first
            const promise = createControllablePromise<void>()
            this.emit('request-keys', promise)

            promise
                .then(() => {
                    this._connections.forEach((conn) => {
                        conn.setUsePfs(this.params.usePfs || this._enforcePfs)

                        if (connect) conn.connect()
                    })
                })
                .catch((err) => {
                    this.emit('error', err)
                })
        }

        // create new connections
        for (let i = this._connections.length; i < this._count; i++) {
            const session = this._sessions[i] // this.params.isMainConnection ? // :
            // this._sessions[0]
            const conn = new SessionConnection(
                {
                    ...this.params,
                    usePfs: this.params.usePfs || this._enforcePfs,
                    isMainConnection: this.params.isMainConnection && i === 0,
                    withUpdates:
                        this.params.isMainConnection && this.params.isMainDcConnection && !this.params.disableUpdates,
                },
                session,
            )

            if (this.params.isMainConnection && this.params.isMainDcConnection) {
                conn.on('update', (update) => this.emit('update', update))
            }
            conn.on('error', (err) => this.emit('error', err, conn))
            conn.on('key-change', (key) => {
                this.emit('key-change', i, key)

                // notify other connections
                for (const conn_ of this._connections) {
                    if (conn_ === conn) continue
                    conn_.onConnected()
                }
            })
            conn.on('tmp-key-change', (key, expires) => this.emit('tmp-key-change', i, key, expires))
            conn.on('future-salts', (salts) => this.emit('future-salts', salts))
            conn.on('auth-begin', () => {
                this._log.debug('received auth-begin from connection %d', i)
                this.emit('auth-begin', i)

                // we need to reset temp auth keys if there are any left

                this._connections.forEach((conn_) => {
                    conn_._session._authKeyTemp.reset()
                    if (conn_ !== conn) conn_.reconnect()
                })
            })
            conn.on('usable', () => this.emit('usable', i))
            conn.on('wait', () => this.emit('wait', i))
            conn.on('request-auth', () => this.emit('request-auth', i))
            conn.on('flood-done', () => {
                this._log.debug('received flood-done from connection %d', i)

                this._connections.forEach((it) => it.flushWhenIdle())
            })

            this._connections.push(conn)
            // if enforcePfsChanged, we need to connect after setting the new auth key
            if (connect && !enforcePfsChanged) conn.connect()
        }
    }

    _destroyed = false
    async destroy(): Promise<void> {
        await Promise.all(this._connections.map((conn) => conn.destroy()))
        this._sessions.forEach((sess) => sess.reset())
        this.removeAllListeners()

        this._destroyed = true
    }

    private _nextConnection = 0

    sendRpc<T extends tl.RpcMethod>(
        request: T,
        stack?: string,
        timeout?: number,
        abortSignal?: AbortSignal,
        chainId?: string | number,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        // if (this.params.isMainConnection) {
        // find the least loaded connection
        let min = Infinity
        let minIdx = 0

        for (let i = 0; i < this._connections.length; i++) {
            const conn = this._connections[i]
            const total = conn._session.queuedRpc.length + conn._session.pendingMessages.size()

            if (total < min) {
                min = total
                minIdx = i
            }
        }

        return this._connections[minIdx].sendRpc(request, stack, timeout, abortSignal, chainId)
        // }

        // round-robin connections
        // since they all share the same session, it doesn't matter which one we use
        // the connection chosen here will only affect the first attempt at sending
        // return this._connections[
        //     this._nextConnection++ % this._connections.length
        // ].sendRpc(request, stack, timeout)
    }

    connect(): void {
        for (const conn of this._connections) {
            conn.connect()
        }
    }

    ensureConnected(): void {
        if (this._connections[0].isConnected) return

        this.connect()
    }

    setAuthKey(authKey: Uint8Array | null, temp = false, idx = 0): void {
        const session = this._sessions[idx]
        const key = temp ? session._authKeyTemp : session._authKey
        key.setup(authKey)
    }

    resetAuthKeys(): void {
        for (const session of this._sessions) {
            session.reset(true)
        }
        this.notifyKeyChange()
    }

    setInactivityTimeout(timeout?: number): void {
        this._log.debug('setting inactivity timeout to %s', timeout)

        // for future connections (if any)
        this.params.inactivityTimeout = timeout

        // for current connections
        for (const conn of this._connections) {
            conn.setInactivityTimeout(timeout)
        }
    }

    notifyKeyChange(): void {
        // only expected to be called on non-main connections
        const session = this._sessions[0]

        if (this.params.usePfs && !session._authKeyTemp.ready) {
            this._log.debug('temp auth key needed but not ready, ignoring key change')

            return
        }

        if (this._sessions[0].queuedRpc.length) {
            // there are pending requests, we need to reconnect.
            this._log.debug('notifying key change on the connection due to queued rpc')
            this._connections[0].onConnected()
        }

        // connection is idle, we don't need to notify it
    }

    notifyNetworkChanged(connected: boolean): void {
        for (const conn of this._connections) {
            conn.notifyNetworkChanged(connected)
        }
    }

    requestAuth(): void {
        this._connections[0]._authorize()
    }

    resetSessions(): void {
        if (this.params.isMainConnection) {
            for (const conn of this._connections) {
                conn._resetSession()
            }
        } else {
            this._connections[0]._resetSession()
        }
    }

    changeTransport(factory: TransportFactory): void {
        this._connections.forEach((conn) => conn.changeTransport(factory))
    }

    getPoolSize(): number {
        return this._connections.length
    }
}
