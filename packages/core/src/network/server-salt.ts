import Long from 'long'
import type { mtp } from '@mtcute/tl'

import { timers } from '../utils'

export class ServerSaltManager {
    private _futureSalts: mtp.RawMt_future_salt[] = []

    currentSalt: Long = Long.ZERO

    isFetching = false

    shouldFetchSalts(): boolean {
        return !this.isFetching && !this.currentSalt.isZero() && this._futureSalts.length < 2
    }

    setFutureSalts(salts: mtp.RawMt_future_salt[]): void {
        this._futureSalts = salts

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
        if (this._futureSalts.length === 0) return

        const next = this._futureSalts.shift()!

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
