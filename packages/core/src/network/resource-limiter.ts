import { Deferred } from '@fuman/utils'

interface ResourceWaiter {
  need: number
  deferred: Deferred<void>
}

export class ResourceLimiter {
  private _available: number
  private _waiters: ResourceWaiter[] = []

  constructor(public max: number) {
    this._available = max
  }

  setMax(max: number): void {
    this._available += max - this.max
    this.max = max
    this._pump()
  }

  tryAcquire(bytes: number): boolean {
    if (bytes > this.max) bytes = this.max

    if (!this._waiters.length && this._available >= bytes) {
      this._available -= bytes
      return true
    }

    return false
  }

  acquire(bytes: number, signal?: AbortSignal): Promise<void> {
    if (this.tryAcquire(bytes)) return Promise.resolve()

    if (bytes > this.max) bytes = this.max

    const deferred = new Deferred<void>()
    const waiter: ResourceWaiter = { need: bytes, deferred }
    this._waiters.push(waiter)

    if (signal) {
      const onAbort = () => {
        const idx = this._waiters.indexOf(waiter)
        if (idx >= 0) this._waiters.splice(idx, 1)
        deferred.reject(signal.reason)
      }
      signal.addEventListener('abort', onAbort, { once: true })
      const removeListener = signal.removeEventListener.bind(signal, 'abort', onAbort) as VoidFunction
      deferred.promise.then(removeListener, removeListener)
    }

    return deferred.promise
  }

  release(bytes: number): void {
    if (bytes > this.max) bytes = this.max
    this._available += bytes
    this._pump()
  }

  private _pump(): void {
    while (this._waiters.length && this._waiters[0].need <= this._available) {
      const waiter = this._waiters.shift()!
      this._available -= waiter.need
      waiter.deferred.resolve()
    }
  }
}
