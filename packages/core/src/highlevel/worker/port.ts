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
    constructor(readonly options: TelegramWorkerPortOptions) {}

    abstract connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void]

    readonly log = new LogManager('worker')

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
        }
    }

    private _connection = this.connectToWorker(this.options.worker, this._onMessage)
    private _invoker = new WorkerInvoker(this._connection[0])
    private _bind = this._invoker.makeBinder<ITelegramClient>('client')

    readonly storage = new TelegramStorageProxy(this._invoker)
    readonly appConfig = new AppConfigManagerProxy(this._invoker)

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

    readonly prepare = this._bind('prepare')
    private _connect = this._bind('connect')
    async connect(): Promise<void> {
        await this._connect()
        await this.storage.self.fetch() // force cache self locally
    }
    readonly close = this._bind('close')
    readonly notifyLoggedIn = this._bind('notifyLoggedIn')
    readonly notifyLoggedOut = this._bind('notifyLoggedOut')
    readonly notifyChannelOpened = this._bind('notifyChannelOpened')
    readonly notifyChannelClosed = this._bind('notifyChannelClosed')
    readonly call = this._bind('call')
    readonly importSession = this._bind('importSession')
    readonly exportSession = this._bind('exportSession')
    readonly handleClientUpdate = this._bind('handleClientUpdate', true)
    readonly getApiCrenetials = this._bind('getApiCrenetials')
    readonly getPoolSize = this._bind('getPoolSize')
    readonly getPrimaryDcId = this._bind('getPrimaryDcId')
    readonly computeSrpParams = this._bind('computeSrpParams')
    readonly computeNewPasswordHash = this._bind('computeNewPasswordHash')
    readonly startUpdatesLoop = this._bind('startUpdatesLoop')
    readonly stopUpdatesLoop = this._bind('stopUpdatesLoop')
}
