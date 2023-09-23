// based on https://github.dev/tdlib/td/blob/master/tdutils/td/utils/FloodControlStrict.h

interface FloodControlLimit {
    duration: number
    count: number
    pos: number
}

/**
 * Flood limiter, based on TDlib
 */
export class FloodControl {
    private _wakeupAt = 1
    private _withoutUpdate = 0
    private _events: number[] = []
    // pair: duration, count
    private _limits: FloodControlLimit[] = []

    // no more than count in each duration
    addLimit(duration: number, count: number): void {
        this._limits.push({ duration, count, pos: 0 })
        this._withoutUpdate = 0
    }

    addEvent(now: number): void {
        this._events.push(now)

        if (this._withoutUpdate > 0) {
            this._withoutUpdate -= 1
        } else {
            this._update(now)
        }
    }

    clear(): void {
        this._events.length = 0
        this._withoutUpdate = 0
        this._wakeupAt = 1
        this._limits.forEach((limit) => (limit.pos = 0))
    }

    get wakeupAt(): number {
        return this._wakeupAt
    }

    private _update(now: number): void {
        let minPos = this._events.length
        this._withoutUpdate = Infinity

        this._limits.forEach((limit) => {
            if (limit.count < this._events.length - limit.pos) {
                limit.pos = this._events.length - limit.count
            }

            while (limit.pos < this._events.length && this._events[limit.pos] + limit.duration < now) {
                limit.pos += 1
            }

            if (limit.count + limit.pos < this._events.length) {
                this._wakeupAt = Math.max(this._wakeupAt, this._events[limit.pos] + limit.duration)
                this._withoutUpdate = 0
            } else {
                this._withoutUpdate = Math.min(this._withoutUpdate, limit.count + limit.pos - this._events.length - 1)
            }

            minPos = Math.min(minPos, limit.pos)
        })

        if (minPos * 2 > this._events.length) {
            this._limits.forEach((limit) => (limit.pos -= minPos))
            this._events.splice(0, minPos)
        }
    }
}
