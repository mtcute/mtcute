import type { tl } from '@mtcute/tl'
import type { RpcCallOptions } from '../../network/network-manager.js'

import type { ICorePlatform } from '../../types/platform.js'
import type { MustEqual } from '../../types/utils.js'
import type { ConnectionState, ITelegramClient } from '../client.types.js'
import type { RawUpdateInfo } from '../updates/types.js'
import type { ClientMessageHandler, SendFn, SomeWorker, WorkerCustomMethods } from './protocol.js'
import { Emitter, unknownToError } from '@fuman/utils'
import { LogManager } from '../../utils/logger.js'
import { TimersManager } from '../managers/timers.js'

import { PeersIndex } from '../types/peers/peers-index.js'
import { AppConfigManagerProxy } from './app-config.js'
import { deserializeError } from './errors.js'
import { WorkerInvoker } from './invoker.js'
import { deserializeResult } from './protocol.js'
import { TelegramStorageProxy } from './storage.js'

export interface TelegramWorkerPortOptions {
    worker: SomeWorker
    platform: ICorePlatform
}

export abstract class TelegramWorkerPort<Custom extends WorkerCustomMethods> implements ITelegramClient {
    readonly log: LogManager
    readonly platform: ICorePlatform

    private _connection
    private _invoker

    readonly storage: TelegramStorageProxy
    readonly appConfig: AppConfigManagerProxy
    // todo: ideally timers should be handled on the worker side,
    // but i'm not sure yet of the best way to handle multiple clients (e.g. in SharedWorker-s)
    // (with one worker client it's not that big of a deal)
    readonly timers: TimersManager

    // bound methods
    readonly prepare: ITelegramClient['prepare']
    private _connect
    readonly close: ITelegramClient['close']
    readonly notifyLoggedIn: ITelegramClient['notifyLoggedIn']
    readonly notifyLoggedOut: ITelegramClient['notifyLoggedOut']
    readonly notifyChannelOpened: ITelegramClient['notifyChannelOpened']
    readonly notifyChannelClosed: ITelegramClient['notifyChannelClosed']
    readonly importSession: ITelegramClient['importSession']
    readonly exportSession: ITelegramClient['exportSession']
    readonly handleClientUpdate: ITelegramClient['handleClientUpdate']
    readonly getApiCredentials: ITelegramClient['getApiCredentials']
    readonly getPoolSize: ITelegramClient['getPoolSize']
    readonly getPrimaryDcId: ITelegramClient['getPrimaryDcId']
    readonly changePrimaryDc: ITelegramClient['changePrimaryDc']
    readonly computeSrpParams: ITelegramClient['computeSrpParams']
    readonly computeNewPasswordHash: ITelegramClient['computeNewPasswordHash']
    readonly startUpdatesLoop: ITelegramClient['startUpdatesLoop']
    readonly stopUpdatesLoop: ITelegramClient['stopUpdatesLoop']
    readonly getMtprotoMessageId: ITelegramClient['getMtprotoMessageId']
    readonly recreateDc: ITelegramClient['recreateDc']

    private _abortController = new AbortController()
    readonly stopSignal: AbortSignal = this._abortController.signal

    constructor(readonly options: TelegramWorkerPortOptions) {
        this.log = new LogManager('worker', options.platform)
        this.platform = options.platform

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
        this.importSession = bind('importSession')
        this.exportSession = bind('exportSession')
        this.handleClientUpdate = bind('handleClientUpdate', true)
        this.getApiCredentials = bind('getApiCredentials')
        this.getPoolSize = bind('getPoolSize')
        this.getPrimaryDcId = bind('getPrimaryDcId')
        this.changePrimaryDc = bind('changePrimaryDc')
        this.computeSrpParams = bind('computeSrpParams')
        this.computeNewPasswordHash = bind('computeNewPasswordHash')
        this.startUpdatesLoop = bind('startUpdatesLoop')
        this.stopUpdatesLoop = bind('stopUpdatesLoop')
        this.getMtprotoMessageId = bind('getMtprotoMessageId')
        this.recreateDc = bind('recreateDc')

        this.timers = new TimersManager()
        this.timers.onError(err => this.onError.emit(unknownToError(err)))
    }

    call<T extends tl.RpcMethod>(
        message: MustEqual<T, tl.RpcMethod>,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (params?.abortSignal) {
            const { abortSignal, ...rest } = params

            return this._invoker.invokeWithAbort('client', 'call', [message, rest], abortSignal) as Promise<
                tl.RpcCallReturn[T['_']]
            >
        }

        return this._invoker.invoke('client', 'call', [message, params]) as Promise<tl.RpcCallReturn[T['_']]>
    }

    abstract connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void]

    onServerUpdate: Emitter<tl.TypeUpdates> = new Emitter()
    onRawUpdate: Emitter<RawUpdateInfo> = new Emitter()
    onConnectionState: Emitter<ConnectionState> = new Emitter()
    onError: Emitter<Error> = new Emitter()

    private _onMessage: ClientMessageHandler = (message) => {
        switch (message.type) {
            case 'log':
                this.log.handler(message.color, message.level, message.tag, message.fmt, message.args)
                break
            case 'server_update':
                this.onServerUpdate.emit(deserializeResult(message.update))
                break
            case 'conn_state':
                this.onConnectionState.emit(message.state)
                break
            case 'update': {
                const peers = new PeersIndex(deserializeResult(message.users), deserializeResult(message.chats))
                peers.hasMin = message.hasMin
                this.onRawUpdate.emit({ update: deserializeResult(message.update), peers })
                break
            }
            case 'result':
                this._invoker.handleResult(message)
                break
            case 'error':
                this.onError.emit(deserializeError(message.error))
                break
            case 'stop':
                this._abortController.abort()
                break
        }
    }

    private _destroyed = false
    destroy(terminate = false): void {
        if (this._destroyed) return
        this.timers.destroy()
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
