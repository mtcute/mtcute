import type { mtp, tl } from '@mtcute/tl'
import type { Logger } from '../utils/index.js'

import type { SessionConnectionParams } from './session-connection.js'

import type { TelegramTransport } from './transports/index.js'
import { Deferred, Emitter, unknownToError } from '@fuman/utils'
import { SessionConnection } from './session-connection.js'

export class MultiSessionConnection {
    private _log: Logger
    private _enforcePfs = false

    // NB: dont forget to update .reset()
    readonly onRequestKeys: Emitter<Deferred<void>> = new Emitter()
    readonly onError: Emitter<Error> = new Emitter()
    readonly onUpdate: Emitter<tl.TypeUpdates> = new Emitter()
    readonly onKeyChange: Emitter<[number, Uint8Array | null]> = new Emitter()
    readonly onTmpKeyChange: Emitter<[number, Uint8Array | null, number]> = new Emitter()
    readonly onFutureSalts: Emitter<mtp.RawMt_future_salt[]> = new Emitter()
    readonly onAuthBegin: Emitter<number> = new Emitter()
    readonly onUsable: Emitter<number> = new Emitter()
    readonly onWait: Emitter<number> = new Emitter()
    readonly onRequestAuth: Emitter<number> = new Emitter()

    constructor(
        readonly params: SessionConnectionParams,
        private _count: number,
        log: Logger,
        logPrefix = '',
    ) {
        this._log = log.create('multi')
        if (logPrefix) this._log.prefix = `[${logPrefix}] `
        this._enforcePfs = _count > 1 && params.isMainConnection

        this._updateConnections()
    }

    readonly _connections: SessionConnection[] = []

    setCount(count: number, connect: boolean = this.params.isMainConnection): void {
        this._count = count

        this._updateConnections(connect)
    }

    getCount(): number {
        return this._count
    }

    private _updateConnections(connect = false): void {
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
                this._connections[i].destroy().catch((err) => {
                    this._log.warn('error destroying connection: %e', err)
                })
            }

            this._connections.splice(this._count)

            return
        }

        if (enforcePfsChanged) {
            // we need to fetch new auth keys first
            const promise = new Deferred<void>()
            this.onRequestKeys.emit(promise)

            promise.promise
                .then(() => {
                    this._connections.forEach((conn) => {
                        conn.setUsePfs(this.params.usePfs || this._enforcePfs)

                        if (connect) conn.connect()
                    })
                })
                .catch((err) => {
                    this.onError.emit(unknownToError(err))
                })
        }

        // create new connections
        for (let i = this._connections.length; i < this._count; i++) {
            const conn = new SessionConnection(
                {
                    ...this.params,
                    usePfs: this.params.usePfs || this._enforcePfs,
                    isMainConnection: this.params.isMainConnection && i === 0,
                    withUpdates:
                        this.params.isMainConnection && this.params.isMainDcConnection && !this.params.disableUpdates,
                },
                this._log,
            )

            if (this.params.isMainConnection && this.params.isMainDcConnection) {
                conn.onUpdate.add(update => this.onUpdate.emit(update))
            }
            conn.onError.add(err => this.onError.emit(err))
            conn.onKeyChange.add((key) => {
                this.onKeyChange.emit([i, key])

                // notify other connections
                for (const conn_ of this._connections) {
                    if (conn_ === conn) continue
                    conn_.onConnected()
                }
            })
            conn.onTmpKeyChange.add(
                event => this.onTmpKeyChange.emit(event === null ? [i, null, 0] : [i, event[0], event[1]]),
            )
            conn.onFutureSalts.add(salts => this.onFutureSalts.emit(salts))
            conn.onAuthBegin.add(() => {
                this._log.debug('received auth-begin from connection %d', i)
                this.onAuthBegin.emit(i)

                // we need to reset temp auth keys if there are any left

                this._connections.forEach((conn_) => {
                    conn_._session._authKeyTemp.reset()
                    if (conn_ !== conn) conn_.reconnect()
                })
            })
            conn.onUsable.add(() => this.onUsable.emit(i))
            conn.onWait.add(() => this.onWait.emit(i))
            conn.onRequestAuth.add(() => this.onRequestAuth.emit(i))
            conn.onFloodDone.add(() => {
                this._log.debug('received flood-done from connection %d', i)

                this._connections.forEach(it => it.flushWhenIdle())
            })

            this._connections.push(conn)
            if (this._authKey !== null) conn._session._authKey.setup(this._authKey)
            // if enforcePfsChanged, we need to connect after setting the new auth key
            if (connect && !enforcePfsChanged) conn.connect()
        }
    }

    _destroyed = false
    async destroy(): Promise<void> {
        await Promise.all(this._connections.map(conn => conn.destroy()))

        this.onRequestKeys.clear()
        this.onError.clear()
        this.onUpdate.clear()
        this.onKeyChange.clear()
        this.onTmpKeyChange.clear()
        this.onFutureSalts.clear()
        this.onAuthBegin.clear()
        this.onUsable.clear()
        this.onWait.clear()
        this.onRequestAuth.clear()

        this._destroyed = true
    }

    private _nextConnection = 0

    sendRpc<T extends tl.RpcMethod>(
        request: T,
        timeout?: number,
        abortSignal?: AbortSignal,
        chainId?: string | number,
    ): Promise<tl.RpcCallReturn[T['_']] | mtp.RawMt_rpc_error> {
        // if (this.params.isMainConnection) {
        // find the least loaded connection
        let min = Infinity
        let minIdx = 0

        for (let i = 0; i < this._connections.length; i++) {
            const conn = this._connections[i]
            const total = conn._session.queuedRpc.length + conn._session.pendingMessages.size

            if (total < min) {
                min = total
                minIdx = i
            }
        }

        return this._connections[minIdx].sendRpc(request, timeout, abortSignal, chainId)
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

    private _authKey: Uint8Array | null = null
    setAuthKey(authKey: Uint8Array | null): void {
        this._authKey = authKey
        for (const conn of this._connections) {
            conn._session._authKey.setup(authKey)
        }
    }

    setTempAuthKey(authKey: Uint8Array | null, idx: number): void {
        this._connections[idx]?._session._authKeyTemp.setup(authKey)
    }

    resetAuthKeys(): void {
        for (const conn of this._connections) {
            conn._session.reset(true)
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
        for (const conn of this._connections) {
            const session = conn._session

            if (this.params.usePfs && !session._authKeyTemp.ready) {
                this._log.debug('temp auth key needed but not ready, ignoring key change')

                continue
            }

            if (session.queuedRpc.length) {
                // there are pending requests, we need to reconnect.
                this._log.debug('notifying key change on the connection due to queued rpc')
                this._connections.forEach(conn => conn.onConnected())
            }

            // connection is idle, we don't need to notify it
        }
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

    async changeTransport(factory: TelegramTransport): Promise<void> {
        await Promise.all(this._connections.map(conn => conn.changeTransport(factory)))
    }

    getPoolSize(): number {
        return this._connections.length
    }
}
