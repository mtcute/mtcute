import { timers } from '@fuman/utils'

/**
 * Wrapper over JS timers that allows re-scheduling them
 * to earlier time
 */
export class EarlyTimer {
    private _timeout?: timers.Timer
    private _immediate?: timers.Immediate
    private _timeoutTs?: number

    private _handler: () => void = () => {}

    constructor() {
        this.emitNow = this.emitNow.bind(this)
    }

    /**
     * Emit the timer when the event loop is idle
     * (basically `setImmediate()`)
     */
    emitWhenIdle(): void {
        if (this._immediate) return

        timers.clearTimeout(this._timeout)
        this._timeoutTs = Date.now()

        if (typeof timers.setImmediate !== 'undefined') {
            this._immediate = timers.setImmediate(this.emitNow)
        } else {
            this._timeout = timers.setTimeout(this.emitNow, 0)
        }
    }

    /**
     * Emit the timer before the next given milliseconds
     *
     * Shorthand for `emitBefore(Date.now() + ms)`
     *
     * @param ms  Milliseconds to schedule for
     */
    emitBeforeNext(ms: number): void {
        return this.emitBefore(Date.now() + ms)
    }

    /**
     * Emit the timer before the given time
     *
     * @param ts  Unix time in MS
     */
    emitBefore(ts: number): void {
        if (!this._timeoutTs || ts < this._timeoutTs) {
            this.reset()
            this._timeout = timers.setTimeout(this.emitNow, ts - Date.now())
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
        if (this._immediate) {
            timers.clearImmediate(this._immediate)
            this._immediate = undefined
        } else {
            timers.clearTimeout(this._timeout)
        }
        this._timeoutTs = undefined
    }

    /**
     * Set timeout handler
     */
    onTimeout(handler: () => void): void {
        this._handler = handler
    }
}
