import type { SendFn, WorkerInboundMessage, WorkerOutboundMessage } from './protocol.js'

import { Deferred } from '@fuman/utils'
import { deserializeError } from './errors.js'
import { deserializeResult, serializeResult } from './protocol.js'

export type InvokeTarget = Extract<WorkerInboundMessage, { type: 'invoke' }>['target']

export class WorkerInvoker {
  constructor(
    private send: SendFn,
    private readonly workerId: string,
    private readonly connectionId: string,
  ) {}

  private _nextId = 0
  private _released = false
  private _releasedError = new Error('Worker connection closed')
  private _pending = new Map<number, Deferred<unknown>>()

  private _close(error: Error, shouldRelease: boolean): void {
    if (this._released) return

    this._released = true
    this._releasedError = error
    if (shouldRelease) {
      this.send({
        _mtcuteWorkerId: this.workerId,
        connectionId: this.connectionId,
        type: 'release',
      })
    }

    for (const pending of this._pending.values()) {
      pending.reject(error)
    }
    this._pending.clear()
  }

  connect(): void {
    this.send({
      _mtcuteWorkerId: this.workerId,
      connectionId: this.connectionId,
      type: 'connect',
    })
  }

  heartbeat(): void {
    if (this._released) return

    this.send({
      _mtcuteWorkerId: this.workerId,
      connectionId: this.connectionId,
      type: 'heartbeat',
    })
  }

  release(): void {
    this._close(new Error('Worker connection closed'), true)
  }

  expire(): void {
    this._close(new Error('Worker connection expired'), false)
  }

  private _invoke(target: InvokeTarget, method: string, args: unknown[], isVoid: boolean, abortSignal?: AbortSignal) {
    if (this._released) {
      if (isVoid) throw this._releasedError

      return Promise.reject(this._releasedError)
    }

    const id = this._nextId++

    this.send({
      _mtcuteWorkerId: this.workerId,
      connectionId: this.connectionId,
      type: 'invoke',
      id,
      target,
      method,
      args: serializeResult(args),
      void: isVoid,
      withAbort: Boolean(abortSignal),
    })

    if (abortSignal) {
      const onAbort = () => {
        if (this._released) return

        this.send({
          _mtcuteWorkerId: this.workerId,
          connectionId: this.connectionId,
          type: 'abort',
          id,
        })
      }
      abortSignal.addEventListener('abort', onAbort, { once: true })

      if (!isVoid) {
        const promise = new Deferred<unknown>()
        this._pending.set(id, promise)

        return promise.promise.finally(() => {
          abortSignal.removeEventListener('abort', onAbort)
        })
      }

      return
    }

    if (!isVoid) {
      const promise = new Deferred<unknown>()

      this._pending.set(id, promise)

      return promise.promise
    }
  }

  invoke(target: InvokeTarget, method: string, args: unknown[]): Promise<unknown> {
    return this._invoke(target, method, args, false)!
  }

  invokeVoid(target: InvokeTarget, method: string, args: unknown[]): void {
    void this._invoke(target, method, args, true)
  }

  invokeWithAbort(target: InvokeTarget, method: string, args: unknown[], abortSignal: AbortSignal): Promise<unknown> {
    if (abortSignal.aborted) return Promise.reject(abortSignal.reason)

    return this._invoke(target, method, args, false, abortSignal)!
  }

  handleResult(msg: Extract<WorkerOutboundMessage, { type: 'result' }>): void {
    const promise = this._pending.get(msg.id)
    if (!promise) return

    this._pending.delete(msg.id)
    if (msg.error) {
      promise.reject(deserializeError(msg.error))
    } else {
      promise.resolve(deserializeResult(msg.result!))
    }
  }

  makeBinder<T>(target: InvokeTarget): <K extends keyof T>(method: K, isVoid?: boolean) => T[K] {
    return <K extends keyof T>(method: K, isVoid = false) => {
      let fn

      if (isVoid) {
        fn = (...args: unknown[]) => this.invokeVoid(target, method as string, args)
      } else {
        fn = (...args: unknown[]) => this.invoke(target, method as string, args)
      }

      return fn as T[K]
    }
  }
}
