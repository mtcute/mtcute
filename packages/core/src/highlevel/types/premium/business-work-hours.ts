import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'

export interface BusinessWorkHoursInterval {
    /** Start hour of the interval (0-23) */
    readonly startHour: number
    /** Start minute of the interval (0-59) */
    readonly startMinute: number

    /** End hour of the interval (0-23) */
    readonly endHour: number
    /** End minute of the interval (0-59) */
    readonly endMinute: number
}

export interface BusinessWorkHoursDay {
    /** Day of the week, 0-6, where 0 is Monday and 6 is Sunday */
    readonly day: number

    /** Whether this day is open 24 hours */
    readonly is24h: boolean

    /** Open intervals for this day */
    readonly intervals: BusinessWorkHoursInterval[]
}

const DAYS_IN_WEEK = 7
const MINUTES_IN_DAY = 24 * 60

export function businessWorkHoursDaysToRaw(day: ReadonlyArray<BusinessWorkHoursDay>): tl.TypeBusinessWeeklyOpen[] {
    const res: tl.TypeBusinessWeeklyOpen[] = []

    for (const d of day) {
        const dayStart = d.day * MINUTES_IN_DAY

        if (d.is24h) {
            res.push({
                _: 'businessWeeklyOpen',
                startMinute: dayStart,
                endMinute: dayStart + MINUTES_IN_DAY,
            })
            continue
        }

        for (const interval of d.intervals) {
            const start = dayStart + interval.startHour * 60 + interval.startMinute
            const end = dayStart + interval.endHour * 60 + interval.endMinute

            if (start >= end) {
                throw new MtArgumentError('startMinute >= endMinute')
            }

            res.push({
                _: 'businessWeeklyOpen',
                startMinute: start,
                endMinute: end,
            })
        }
    }

    return res
}

/**
 * Information about business work hours.
 */
export class BusinessWorkHours {
    constructor(readonly raw: tl.RawBusinessWorkHours) {}

    /** Whether the business is open right now */
    get isOpenNow(): boolean {
        return this.raw.openNow!
    }

    /**
     * Identifier of the time zone in which the {@link hours} are defined,
     * in the IANA format.
     */
    get timezoneId(): string {
        return this.raw.timezoneId
    }

    /** Raw "open" intervals */
    get intervals(): tl.TypeBusinessWeeklyOpen[] {
        return this.raw.weeklyOpen
    }

    /**
     * Parsed business hours intervals per week day.
     *
     * @returns  Array of 7 elements, each representing a day of the week (starting from Monday = 0)
     */
    get days(): ReadonlyArray<BusinessWorkHoursDay> {
        const days: BusinessWorkHoursDay[] = Array.from({ length: DAYS_IN_WEEK }, (_, i) => ({
            day: i,
            is24h: false,
            intervals: [],
        }))

        // sort intervals by start time
        const sorted = [...this.raw.weeklyOpen].sort((a, b) => a.startMinute - b.startMinute)

        // merge overlapping/consecutive intervals
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1]
            const cur = sorted[i]

            if (prev.endMinute >= cur.startMinute) {
                prev.endMinute = cur.endMinute
                sorted.splice(i, 1)
                i--
            }
        }

        const mondayPrepend: BusinessWorkHoursInterval[] = []

        // process intervals
        for (const interval of sorted) {
            if (interval.startMinute > interval.endMinute) {
                throw new MtArgumentError('startMinute is greater than endMinute')
            }

            const startDay = Math.floor(interval.startMinute / MINUTES_IN_DAY)
            const endDay = Math.floor(interval.endMinute / MINUTES_IN_DAY)

            if (endDay > DAYS_IN_WEEK + 1) {
                throw new MtArgumentError('interval spans more than a week')
            }

            for (
                let day = startDay, dayStart = startDay * MINUTES_IN_DAY;
                day <= endDay;
                day++, dayStart += MINUTES_IN_DAY
            ) {
                const startWithin = Math.max(interval.startMinute, dayStart) - dayStart
                const endWithin = Math.min(interval.endMinute, dayStart + MINUTES_IN_DAY) - dayStart

                const startHour = Math.floor(startWithin / 60)
                const startMinute = startWithin % 60
                const endHour = Math.floor(endWithin / 60)
                const endMinute = endWithin % 60

                if (startHour === 0 && startMinute === 0 && endHour === 0 && endMinute === 0) {
                    continue
                }

                const obj: BusinessWorkHoursInterval = {
                    startHour,
                    startMinute,
                    endHour,
                    endMinute,
                }

                if (day === DAYS_IN_WEEK) {
                    // prepend to Monday
                    mondayPrepend.push(obj)
                } else {
                    days[day].intervals.push(obj)
                }
            }
        }

        if (mondayPrepend.length > 0) {
            // we do this like this to keep everything sorted
            days[0].intervals.unshift(...mondayPrepend)
        }

        // set up 24h days
        for (const day of days) {
            if (day.intervals.length !== 1) continue
            const interval = day.intervals[0]

            if (
                interval.startHour === 0 &&
                interval.startMinute === 0 &&
                ((interval.endHour === 24 && interval.endMinute === 0) ||
                    (interval.endHour === 23 && interval.endMinute === 59))
            ) {
                (day as tl.Mutable<BusinessWorkHoursDay>).is24h = true
            }
        }

        return days
    }
}

makeInspectable(BusinessWorkHours, undefined, ['intervals'])
memoizeGetters(BusinessWorkHours, ['days'])
