import type { RpcCallOptions } from '../../network/network-manager.js'

import type { tl } from '../../tl/index.js'
import { AsyncInterval } from '@fuman/utils'

export interface RpcTimerSpec {
  kind: 'rpc'
  key: string
  interval: number
  request: tl.RpcMethod
  options?: Omit<RpcCallOptions, 'abortSignal' | 'manager'>
  startNow?: boolean
}

interface ManagedTimer {
  ownerId: string
  timer: AsyncInterval
}

export class TimersManager {
  private _timers: Map<string, ManagedTimer> = new Map()
  private _errorHandler?: (err: unknown) => void

  constructor(
    private readonly _executeRpc: (spec: RpcTimerSpec, abortSignal: AbortSignal) => Promise<void>,
  ) {}

  // These methods are async for API parity with worker-backed clients,
  // where keepalive state is owned by the shared client/worker and accessed over RPC.
  async exists(key: string): Promise<boolean> {
    return this._timers.has(key)
  }

  async upsert(spec: RpcTimerSpec): Promise<void> {
    this.upsertOwned('local', spec)
  }

  async cancel(key: string): Promise<void> {
    this._cancel(key)
  }

  upsertOwned(ownerId: string, spec: RpcTimerSpec): void {
    this._cancel(spec.key)

    const timer = new AsyncInterval(
      abortSignal => this._executeRpc(spec, abortSignal),
      spec.interval,
    )

    if (this._errorHandler) {
      timer.onError(this._errorHandler)
    }

    this._timers.set(spec.key, {
      ownerId,
      timer,
    })

    if (spec.startNow) timer.startNow()
    else timer.start()
  }

  clearOwner(ownerId: string): void {
    for (const [key, timer] of Array.from(this._timers.entries())) {
      if (timer.ownerId !== ownerId) continue

      this._cancel(key)
    }
  }

  onError(handler: (err: unknown) => void): void {
    this._errorHandler = handler
  }

  destroy(): void {
    for (const key of Array.from(this._timers.keys())) {
      this._cancel(key)
    }
  }

  private _cancel(key: string): void {
    const timer = this._timers.get(key)

    if (!timer) return

    timer.timer.stop()
    this._timers.delete(key)
  }
}
