import { tl } from '@mtcute/tl'

import { LogManager } from '../../utils/logger.js'
import { ConnectionState, ITelegramClient } from '../client.types.js'
import { PeersIndex } from '../types/peers/peers-index.js'
import { RawUpdateHandler } from '../updates/types.js'
import { AppConfigManagerProxy } from './app-config.js'
import { WorkerInvoker } from './invoker.js'
import { ClientMessageHandler, SendFn, SomeWorker, WorkerCustomMethods } from './protocol.js'
import { TelegramStorageProxy } from './storage.js'

export interface TelegramWorkerPortOptions {
    worker: SomeWorker
}

export abstract class TelegramWorkerPort<Custom extends WorkerCustomMethods> implements ITelegramClient {
    readonly log

    private _connection
    private _invoker

    readonly storage
    readonly appConfig

    // bound methods
    readonly prepare
    private _connect
    readonly close
    readonly notifyLoggedIn
    readonly notifyLoggedOut
    readonly notifyChannelOpened
    readonly notifyChannelClosed
    readonly call
    readonly importSession
    readonly exportSession
    readonly handleClientUpdate
    readonly getApiCrenetials
    readonly getPoolSize
    readonly getPrimaryDcId
    readonly computeSrpParams
    readonly computeNewPasswordHash
    readonly startUpdatesLoop
    readonly stopUpdatesLoop

    private _abortController = new AbortController()
    readonly stopSignal = this._abortController.signal

    constructor(readonly options: TelegramWorkerPortOptions) {
        this.log = new LogManager('worker')

        this._connection = this.connectToWorker(this.options.worker, this._onMessage)
        this._invoker = new WorkerInvoker(this._connection[0])

        this.storage = new TelegramStorageProxy(this._invoker)
        this.appConfig = new AppConfigManagerProxy(this._invoker)

        const bind = this._invoker.makeBinder<ITelegramClient>('client')

        this.prepare = bind('prepare')
        this._connect = bind('connect')

        this.close = bind('close')
        this.notifyLoggedIn = bind('notifyLoggedIn')
        this.notifyLoggedOut = bind('notifyLoggedOut')
        this.notifyChannelOpened = bind('notifyChannelOpened')
        this.notifyChannelClosed = bind('notifyChannelClosed')
        this.call = bind('call')
        this.importSession = bind('importSession')
        this.exportSession = bind('exportSession')
        this.handleClientUpdate = bind('handleClientUpdate', true)
        this.getApiCrenetials = bind('getApiCrenetials')
        this.getPoolSize = bind('getPoolSize')
        this.getPrimaryDcId = bind('getPrimaryDcId')
        this.computeSrpParams = bind('computeSrpParams')
        this.computeNewPasswordHash = bind('computeNewPasswordHash')
        this.startUpdatesLoop = bind('startUpdatesLoop')
        this.stopUpdatesLoop = bind('stopUpdatesLoop')
    }

    abstract connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void]

    private _serverUpdatesHandler: (updates: tl.TypeUpdates) => void = () => {}
    onServerUpdate(handler: (updates: tl.TypeUpdates) => void): void {
        this._serverUpdatesHandler = handler
    }

    private _errorHandler: (err: unknown) => void = () => {}
    onError(handler: (err: unknown) => void): void {
        this._errorHandler = handler
    }
    emitError(err: unknown): void {
        this._errorHandler(err)
    }

    private _updateHandler: RawUpdateHandler = () => {}
    onUpdate(handler: RawUpdateHandler): void {
        this._updateHandler = handler
    }

    private _connectionStateHandler: (state: ConnectionState) => void = () => {}
    onConnectionState(handler: (state: ConnectionState) => void): void {
        this._connectionStateHandler = handler
    }

    private _onMessage: ClientMessageHandler = (message) => {
        switch (message.type) {
            case 'log':
                this.log.handler(message.color, message.level, message.tag, message.fmt, message.args)
                break
            case 'server_update':
                this._serverUpdatesHandler(message.update)
                break
            case 'conn_state':
                this._connectionStateHandler(message.state)
                break
            case 'update': {
                const peers = new PeersIndex(message.users, message.chats)
                peers.hasMin = message.hasMin
                this._updateHandler(message.update, peers)
                break
            }
            case 'result':
                this._invoker.handleResult(message)
                break
            case 'error':
                this.emitError(message.error)
                break
            case 'stop':
                this._abortController.abort()
                break
        }
    }

    private _destroyed = false
    destroy(terminate = false): void {
        if (this._destroyed) return
        this._connection[1]()
        this._destroyed = true

        if (terminate && 'terminate' in this.options.worker) {
            Promise.resolve(this.options.worker.terminate()).catch(() => {})
        }
    }

    invokeCustom<T extends keyof Custom>(method: T, ...args: Parameters<Custom[T]>): Promise<ReturnType<Custom[T]>> {
        return this._invoker.invoke('custom', method as string, args) as Promise<ReturnType<Custom[T]>>
    }

    async connect(): Promise<void> {
        await this._connect()
        await this.storage.self.fetch() // force cache self locally
    }
}
