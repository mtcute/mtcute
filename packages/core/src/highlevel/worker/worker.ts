import type { BaseTelegramClient } from '../base.js'

import type {
  RespondFn,
  SerializedResult,
  WorkerCustomMethods,
  WorkerInboundMessage,
  WorkerMessageHandler,
} from './protocol.js'
import { serializeError } from './errors.js'
import {
  DEFAULT_WORKER_ID,
  deserializeResult,
  serializeResult,
} from './protocol.js'

const WORKER_HEARTBEAT_TIMEOUT = 60_000
const WORKER_HEARTBEAT_SWEEP_INTERVAL = 10_000

export interface TelegramWorkerOptions<T extends WorkerCustomMethods> {
  client: BaseTelegramClient
  /** mtcute worker ID to disambiguate multiple clients within the same underlying worker */
  workerId?: string
  /**
   * What to do when the last connection to the worker is closed?
   *
   * - `destroy`: destroy the client, terminating the worker
   * - `disconnect`: disconnect the client, but keep the worker running until `forceDestroy` is called
   * - `nothing`: do nothing, lifecycle is managed manually
   * - function: call this function when the last connection is closed, then execute the action returned by the function
   *
   * @default 'nothing'
   */
  onLastDisconnected?: 'destroy' | 'disconnect' | 'nothing' | (() => 'destroy' | 'disconnect' | 'nothing')
  /** additional custom methods to expose */
  customMethods?: T
}

export abstract class TelegramWorker<T extends WorkerCustomMethods> {
  readonly client: BaseTelegramClient
  broadcast: RespondFn = () => {}
  private _cleanup: VoidFunction[] = []
  private _heartbeatSweep: ReturnType<typeof setInterval> | undefined
  private _mounted = false

  abstract registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction]

  readonly activeConnections: Set<string> = new Set()
  readonly connectionLastSeen: Map<string, number> = new Map()
  readonly pendingAborts: Map<string, Map<number, AbortController>> = new Map()
  readonly workerId: string
  private _disconnecting?: Promise<void>
  private _destroying?: Promise<void>

  constructor(readonly params: TelegramWorkerOptions<T>) {
    this.workerId = params.workerId ?? DEFAULT_WORKER_ID
    this.client = params.client
  }

  mount(): this {
    if (this._mounted) return this

    const [broadcast, cleanup] = this.registerWorker((message, respond) => {
      if (message._mtcuteWorkerId !== this.workerId) return

      switch (message.type) {
        case 'connect':
          this.touchConnection(message.connectionId, true)
          break
        case 'heartbeat':
          if (!this.activeConnections.has(message.connectionId)) {
            this.respondConnectionExpired(respond, message.connectionId)
            break
          }

          this.touchConnection(message.connectionId)
          break
        case 'release':
          this.onRelease(message.connectionId)
          break
        case 'invoke':
          if (!this.activeConnections.has(message.connectionId)) {
            this.respondConnectionExpired(respond, message.connectionId)
            break
          }

          this.touchConnection(message.connectionId)
          this.onInvoke(message, respond)
          break
        case 'abort': {
          if (!this.activeConnections.has(message.connectionId)) {
            this.respondConnectionExpired(respond, message.connectionId)
            break
          }

          this.touchConnection(message.connectionId)
          const pending = this.pendingAborts.get(message.connectionId)
          const abort = pending?.get(message.id)

          if (!abort) break

          abort.abort()
          pending!.delete(message.id)
          if (!pending!.size) {
            this.pendingAborts.delete(message.connectionId)
          }
          break
        }
      }
    })

    this.broadcast = broadcast
    this._cleanup.push(cleanup)
    this._heartbeatSweep = setInterval(this.sweepExpiredConnections, WORKER_HEARTBEAT_SWEEP_INTERVAL)
    this._mounted = true

    const client = this.client
    const prevLogHandler = client.log.mgr.handler
    const onLog = (color: number, level: number, tag: string, fmt: string, args: unknown[]) =>
      this.broadcast({
        _mtcuteWorkerId: this.workerId,
        type: 'log',
        color,
        level,
        tag,
        fmt,
        args,
      })
    const onError = (err: Error) =>
      this.broadcast({
        _mtcuteWorkerId: this.workerId,
        type: 'error',
        error: serializeError(err),
      })
    const onConnectionState = (state: Parameters<typeof client.onConnectionState.emit>[0]) =>
      this.broadcast({
        _mtcuteWorkerId: this.workerId,
        type: 'conn_state',
        state,
      })
    const onStop = () => this.broadcast({
      _mtcuteWorkerId: this.workerId,
      type: 'stop',
    })

    client.log.mgr.handler = onLog
    client.onError.add(onError)
    client.onConnectionState.add(onConnectionState)
    client.stopSignal.addEventListener('abort', onStop)

    this._cleanup.push(
      () => { client.log.mgr.handler = prevLogHandler },
      () => client.onError.remove(onError),
      () => client.onConnectionState.remove(onConnectionState),
      () => client.stopSignal.removeEventListener('abort', onStop),
    )

    if (client.updates) {
      const onRawUpdate = ({ update, peers }: Parameters<typeof client.onRawUpdate.emit>[0]) =>
        this.broadcast({
          _mtcuteWorkerId: this.workerId,
          type: 'update',
          update: serializeResult(update),
          users: serializeResult(peers.users),
          chats: serializeResult(peers.chats),
          hasMin: peers.hasMin,
        })

      client.onRawUpdate.add(onRawUpdate)
      this._cleanup.push(() => client.onRawUpdate.remove(onRawUpdate))
    } else {
      const onServerUpdate = (update: Parameters<typeof client.onServerUpdate.emit>[0]) =>
        this.broadcast({
          _mtcuteWorkerId: this.workerId,
          type: 'server_update',
          update: serializeResult(update),
        })

      client.onServerUpdate.add(onServerUpdate)
      this._cleanup.push(() => client.onServerUpdate.remove(onServerUpdate))
    }

    return this
  }

  private getConnectionAborts(connectionId: string): Map<number, AbortController> {
    const existing = this.pendingAborts.get(connectionId)
    if (existing) return existing

    const created = new Map<number, AbortController>()
    this.pendingAborts.set(connectionId, created)

    return created
  }

  private deletePendingAbort(connectionId: string, id: number): void {
    const pending = this.pendingAborts.get(connectionId)
    if (!pending) return

    pending.delete(id)
    if (!pending.size) {
      this.pendingAborts.delete(connectionId)
    }
  }

  private touchConnection(connectionId: string, activate = false): void {
    if (activate) {
      this.activeConnections.add(connectionId)
    } else if (!this.activeConnections.has(connectionId)) {
      return
    }

    this.connectionLastSeen.set(connectionId, Date.now())
  }

  private respondConnectionExpired(respond: RespondFn, connectionId: string): void {
    respond({
      _mtcuteWorkerId: this.workerId,
      connectionId,
      type: 'connection_expired',
    })
  }

  private sweepExpiredConnections = (): void => {
    const now = Date.now()

    for (const [connectionId, lastSeen] of this.connectionLastSeen) {
      if (now - lastSeen < WORKER_HEARTBEAT_TIMEOUT) continue

      this.respondConnectionExpired(this.broadcast, connectionId)
      this.onRelease(connectionId)
    }
  }

  private onRelease(connectionId: string): void {
    const wasActive = this.activeConnections.delete(connectionId)
    const hadLastSeen = this.connectionLastSeen.delete(connectionId)
    this.client.timers.clearOwner(connectionId)

    const pending = this.pendingAborts.get(connectionId)
    if (pending) {
      for (const abort of pending.values()) {
        abort.abort()
      }
      this.pendingAborts.delete(connectionId)
    }

    if (!wasActive && !hadLastSeen && !pending) return

    if (this.activeConnections.size !== 0) return

    let onLastDisconnected = this.params.onLastDisconnected ?? 'nothing'
    if (typeof onLastDisconnected === 'function') {
      onLastDisconnected = onLastDisconnected()
      return
    }

    switch (onLastDisconnected) {
      case 'nothing':
        return
      case 'disconnect':
        if (this._disconnecting || this._destroying) return

        void this.disconnectSharedClient().catch(() => {})
        return
      case 'destroy':
        if (this._destroying) return

        void this.forceDestroy().catch(() => {})
    }
  }

  private disconnectSharedClient(): Promise<void> {
    if (this._destroying) return this._destroying
    if (this._disconnecting) return this._disconnecting

    this._disconnecting = this.client.disconnect()
      .finally(() => {
        this._disconnecting = undefined
      })

    return this._disconnecting
  }

  private forceDestroy(): Promise<void> {
    this.activeConnections.clear()
    this.connectionLastSeen.clear()

    for (const pending of this.pendingAborts.values()) {
      for (const abort of pending.values()) {
        abort.abort()
      }
    }
    this.pendingAborts.clear()

    if (!this._destroying) {
      this._destroying = (this._disconnecting ?? Promise.resolve())
        .catch(() => {})
        .then(() => this.client.destroy())
    }

    return this._destroying
  }

  private shouldSyncCurrentUser(msg: Extract<WorkerInboundMessage, { type: 'invoke' }>): boolean {
    if (msg.target === 'storage-self') {
      return msg.method === 'store' || msg.method === 'storeFrom' || msg.method === 'update'
    }

    return msg.target === 'client' && (msg.method === 'notifyLoggedIn' || msg.method === 'notifyLoggedOut' || msg.method === 'importSession')
  }

  private onInvoke(msg: Extract<WorkerInboundMessage, { type: 'invoke' }>, respond: RespondFn) {
    if (msg.target === 'client' && msg.method === 'destroy') {
      this.forceDestroy()
        .then(() => {
          if (msg.void) return

          respond({
            _mtcuteWorkerId: this.workerId,
            connectionId: msg.connectionId,
            type: 'result',
            id: msg.id,
          })
        })
        .catch((err) => {
          respond({
            _mtcuteWorkerId: this.workerId,
            connectionId: msg.connectionId,
            type: 'result',
            id: msg.id,
            error: serializeError(err),
          })
        })

      return
    }

    if (msg.target === 'client' && msg.method === 'disconnect') {
      this.disconnectSharedClient()
        .then(() => {
          if (msg.void) return

          respond({
            _mtcuteWorkerId: this.workerId,
            connectionId: msg.connectionId,
            type: 'result',
            id: msg.id,
          })
        })
        .catch((err) => {
          respond({
            _mtcuteWorkerId: this.workerId,
            connectionId: msg.connectionId,
            type: 'result',
            id: msg.id,
            error: serializeError(err),
          })
        })

      return
    }

    let target: any

    switch (msg.target) {
      case 'custom':
        target = this.params.customMethods
        break
      case 'timers':
        target = {
          upsert: (spec: Parameters<typeof this.client.timers.upsert>[0]) =>
            Promise.resolve(this.client.timers.upsertOwned(msg.connectionId, spec)),
          cancel: (key: string) => this.client.timers.cancel(key),
          exists: (key: string) => this.client.timers.exists(key),
        }
        break
      case 'client':
        target = this.client
        break
      case 'storage':
        target = this.client.storage
        break
      case 'storage-self':
        target = this.client.storage.self
        break
      case 'storage-peers':
        target = this.client.storage.peers
        break
      case 'app-config':
        target = this.client.appConfig
        break

      default: {
        respond({
          _mtcuteWorkerId: this.workerId,
          connectionId: msg.connectionId,
          type: 'result',
          id: msg.id,
          error: serializeError(new Error(`Unknown target ${msg.target}`)),
        })

        return
      }
    }

    // eslint-disable-next-line ts/no-unsafe-assignment
    const method = target[msg.method]

    if (!method) {
      respond({
        _mtcuteWorkerId: this.workerId,
        connectionId: msg.connectionId,
        type: 'result',
        id: msg.id,
        error: serializeError(new Error(`Method ${msg.method} not found on ${msg.target}`)),
      })

      return
    }

    let args: unknown[]

    if (msg.target === 'client' && msg.method === 'call' && msg.withAbort) {
      const abort = new AbortController()
      this.getConnectionAborts(msg.connectionId).set(msg.id, abort)

      args = [
        deserializeResult((msg.args as unknown as unknown[])[0] as SerializedResult<unknown>),
        {
          ...((msg.args as unknown as unknown[])[1] as object),
          abortSignal: abort.signal,
        },
      ]
    } else {
      args = deserializeResult(msg.args)
    }

    const syncCurrentUser = this.shouldSyncCurrentUser(msg)

    // eslint-disable-next-line ts/no-unsafe-call
    Promise.resolve(method.apply(target, args))
      .then(async (res) => {
        if (msg.withAbort) {
          this.deletePendingAbort(msg.connectionId, msg.id)
        }

        if (syncCurrentUser) {
          try {
            this.broadcast({
              _mtcuteWorkerId: this.workerId,
              type: 'self_sync',
              self: serializeResult(await this.client.storage.self.fetch()),
            })
          } catch {}
        }

        if (msg.void) return

        respond({
          _mtcuteWorkerId: this.workerId,
          connectionId: msg.connectionId,
          type: 'result',
          id: msg.id,
          result: serializeResult(res),
        })
      })
      .catch((err) => {
        if (msg.withAbort) {
          this.deletePendingAbort(msg.connectionId, msg.id)
        }

        respond({
          _mtcuteWorkerId: this.workerId,
          connectionId: msg.connectionId,
          type: 'result',
          id: msg.id,
          error: serializeError(err),
        })
      })
  }

  destroy(): void {
    if (this._heartbeatSweep !== undefined) {
      clearInterval(this._heartbeatSweep)
    }
    for (const cleanup of this._cleanup) {
      cleanup()
    }
    this._mounted = false
  }
}
