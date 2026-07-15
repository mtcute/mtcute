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

    queueMicrotask(this.emitNow)
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
      // NB: never invoke the handler synchronously, even if the deadline is already past:
      // on workerd performance.now() is frozen within a task, so a past-due deadline
      // re-armed from within the handler would recurse infinitely (#148)
      const diff = ts - performance.now()
      this._timeout = timers.setTimeout(this.emitNow, Math.max(diff, 0))
      this._timeoutTs = ts
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
