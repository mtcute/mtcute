import { timers } from '@fuman/utils'
import { sleepWithAbort } from '../utils/misc-utils.js'

const INITIAL_DELAY_MS = 50
const MIN_DELAY_MS = 3
const DELAY_DECAY = 0.8

export class DownloadDelayGate {
  private _nextAt = 0
  private _delay = INITIAL_DELAY_MS

  wait(signal?: AbortSignal): Promise<void> {
    const now = performance.now()
    const at = Math.max(now, this._nextAt)
    this._nextAt = at + this._delay
    this._delay = Math.max(this._delay * DELAY_DECAY, MIN_DELAY_MS)

    const ms = at - now
    if (ms <= 0) return Promise.resolve()
    if (signal) return sleepWithAbort(ms, signal)
    return new Promise((resolve) => {
      timers.setTimeout(resolve, ms)
    })
  }
}
