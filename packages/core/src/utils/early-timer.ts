import { timers } from '@fuman/utils'

/**
 * Wrapper over JS timers that allows re-scheduling them
 * to earlier time
 */
export class EarlyTimer {
  private _timeout?: timers.Timer
  private _timeoutTs?: number

  private _handler: () => void = () => {}

  constructor() {
    this.emitNow = this.emitNow.bind(this)
  }

  /**
   * Emit the timer when the event loop is idle
   * (basically `queueMicrotask()`)
   */
  emitWhenIdle(): void {
    timers.clearTimeout(this._timeout)
    this._timeoutTs = performance.now()

    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(this.emitNow)
    } else {
      this._timeout = timers.setTimeout(this.emitNow, 0)
    }
  }

  /**
   * Emit the timer before the next given milliseconds
   *
   * Shorthand for `emitBefore(performance.now() + ms)`
   *
   * @param ms  Milliseconds to schedule for
   */
  emitBeforeNext(ms: number): void {
    return this.emitBefore(performance.now() + ms)
  }

  /**
   * Emit the timer before the given time
   *
   * @param ts  timestamp in ms relative to `performance.timeOrigin`
   */
  emitBefore(ts: number): void {
    if (!this._timeoutTs || ts < this._timeoutTs) {
      this.reset()
      const diff = ts - performance.now()
      if (diff > 0) {
        this._timeout = timers.setTimeout(this.emitNow, diff)
        this._timeoutTs = ts
      } else {
        this._handler()
      }
    }
  }

  /**
   * Emit the timer right now
   */
  emitNow(): void {
    this.reset()
    this._handler()
  }

  /**
   * Cancel the timer
   */
  reset(): void {
    timers.clearTimeout(this._timeout)
    this._timeoutTs = undefined
  }

  /**
   * Set timeout handler
   */
  onTimeout(handler: () => void): void {
    this._handler = handler
  }
}
