import type { mtp } from '@mtcute/tl'
import { timers } from '@fuman/utils'
import Long from 'long'

export class ServerSaltManager {
  private _futureSalts: mtp.RawMt_future_salt[] = []

  currentSalt: Long = Long.ZERO

  isFetching = false

  shouldFetchSalts(): boolean {
    return !this.isFetching && !this.currentSalt.isZero() && this._futureSalts.length < 2
  }

  setFutureSalts(salts: mtp.RawMt_future_salt[]): void {
    this._futureSalts = salts

    // todo: we should use adjusted monotonic clock here
    const now = Date.now() / 1000

    while (salts.length > 0 && now > salts[0].validSince) {
      this.currentSalt = salts[0].salt
      this._futureSalts.shift()
    }

    if (!this._futureSalts.length) this.currentSalt = Long.ZERO
    else this._scheduleNext()
  }

  private _timer?: timers.Timer

  private _scheduleNext(): void {
    if (this._timer) timers.clearTimeout(this._timer)

    const now = Date.now() / 1000

    // find the first valid salt from the stored ones
    let next: mtp.RawMt_future_salt | undefined
    while (this._futureSalts.length !== 0) {
      const salt = this._futureSalts.shift()!
      if (salt.validSince <= now && now <= salt.validUntil) {
        next = salt
        break
      }
    }

    if (!next) {
      // no valid salts left, nothing to schedule
      return
    }

    this._timer = timers.setTimeout(
      () => {
        this.currentSalt = next.salt
        this._scheduleNext()
      },
      next.validSince * 1000 - Date.now(),
    )
  }

  destroy(): void {
    timers.clearTimeout(this._timer)
  }
}
