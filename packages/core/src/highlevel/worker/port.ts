import type { tl } from '@mtcute/tl'
import type { RpcCallOptions } from '../../network/network-manager.js'

import type { ICorePlatform } from '../../types/platform.js'
import type { MustEqual } from '../../types/utils.js'
import type { ConnectionState, ITelegramClient } from '../client.types.js'
import type { RawUpdateInfo } from '../updates/types.js'
import type { ClientMessageHandler, SendFn, SomeWorker, WorkerCustomMethods } from './protocol.js'
import { Emitter } from '@fuman/utils'
import { LogManager } from '../../utils/logger.js'

import { PeersIndex } from '../types/peers/peers-index.js'
import { AppConfigManagerProxy } from './app-config.js'
import { deserializeError } from './errors.js'
import { WorkerInvoker } from './invoker.js'
import { DEFAULT_WORKER_ID, deserializeResult } from './protocol.js'
import { TelegramStorageProxy } from './storage.js'
import { WorkerTimersManager } from './timers.js'

export interface TelegramWorkerPortOptions {
  worker: SomeWorker
  workerId?: string
  platform: ICorePlatform
}

const WORKER_HEARTBEAT_INTERVAL = 10_000

let _nextConnectionId = 0

function makeConnectionId(): string {
  return `${Date.now().toString(36)}-${(_nextConnectionId++).toString(36)}-${Math.random().toString(36).slice(2)}`
}

export abstract class TelegramWorkerPort<Custom extends WorkerCustomMethods> implements ITelegramClient {
  readonly log: LogManager
  readonly platform: ICorePlatform

  private _connection
  private _invoker

  readonly storage: TelegramStorageProxy
  readonly appConfig: AppConfigManagerProxy
  readonly timers: WorkerTimersManager

  // bound methods
  readonly prepare: ITelegramClient['prepare']
  private _connect
  readonly disconnect: ITelegramClient['disconnect']
  readonly unsafeForceDestroy: () => Promise<void>
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
  readonly workerId: string
  readonly connectionId: string
  private _cancelBeforeExit: (() => void) | undefined
  private _heartbeatTimer: ReturnType<typeof setInterval> | undefined

  constructor(readonly options: TelegramWorkerPortOptions) {
    this.log = new LogManager('worker', options.platform)
    this.platform = options.platform

    this.workerId = options.workerId ?? DEFAULT_WORKER_ID
    this.connectionId = makeConnectionId()

    this._connection = this.connectToWorker(this.options.worker, this._onMessage)
    this._invoker = new WorkerInvoker(this._connection[0], this.workerId, this.connectionId)
    this._invoker.connect()
    this._heartbeatTimer = setInterval(() => {
      this._invoker.heartbeat()
    }, WORKER_HEARTBEAT_INTERVAL)
    this._cancelBeforeExit = this.platform.beforeExit(() => {
      void this.destroy()
    })

    this.storage = new TelegramStorageProxy(this._invoker)
    this.appConfig = new AppConfigManagerProxy(this._invoker)

    const bind = this._invoker.makeBinder<ITelegramClient>('client')

    this.prepare = bind('prepare')
    this._connect = bind('connect')

    this.disconnect = bind('disconnect')
    this.unsafeForceDestroy = bind('destroy')
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

    this.timers = new WorkerTimersManager(this._invoker)
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
    if (message._mtcuteWorkerId !== this.workerId) return
    if ('connectionId' in message && message.connectionId !== this.connectionId) return

    switch (message.type) {
      case 'log':
        this.log.handler(message.color, message.level, message.tag, message.fmt, message.args)
        break
      case 'server_update':
        this.onServerUpdate.emit(deserializeResult(message.update))
        break
      case 'self_sync':
        this.storage.self.setCached(deserializeResult(message.self))
        break
      case 'connection_expired': {
        const error = new Error('Worker connection expired')
        this.onError.emit(error)
        this._close(false)
        break
      }
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
        this._close(false)
        break
    }
  }

  private _closed = false

  private _close(sendRelease: boolean): void {
    if (this._closed) return
    this._closed = true

    if (this._heartbeatTimer !== undefined) {
      clearInterval(this._heartbeatTimer)
    }
    this._cancelBeforeExit?.()
    if (sendRelease) {
      this._invoker.release()
    } else {
      this._invoker.expire()
    }
    this._connection[1]()
    this._abortController.abort()
  }

  async destroy(terminate = false): Promise<void> {
    this._close(true)

    if (terminate && 'terminate' in this.options.worker) {
      await Promise.resolve(this.options.worker.terminate())
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
