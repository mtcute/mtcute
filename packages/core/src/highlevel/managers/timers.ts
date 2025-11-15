import { AsyncInterval } from '@fuman/utils'

export class TimersManager {
  private _timers: Map<string, AsyncInterval> = new Map()
  private _errorHandler?: (err: unknown) => void

  constructor() {}

  exists(key: string): boolean {
    return this._timers.has(key)
  }

  create(
    key: string,
    handler: (abortSignal: AbortSignal) => Promise<void>,
    interval: number,
    startNow = false,
  ): void {
    if (this._timers.has(key)) {
      return
    }

    const timer = new AsyncInterval(handler, interval)
    if (this._errorHandler) timer.onError(this._errorHandler)
    this._timers.set(key, timer)

    if (startNow) timer.startNow()
    else timer.start()
  }

  cancel(key: string): void {
    const timer = this._timers.get(key)

    if (!timer) return

    timer.stop()
    this._timers.delete(key)
  }

  onError(handler: (err: unknown) => void): void {
    this._errorHandler = handler
  }

  destroy(): void {
    for (const timer of this._timers.values()) {
      timer.stop()
    }
    this._timers.clear()
  }
}
