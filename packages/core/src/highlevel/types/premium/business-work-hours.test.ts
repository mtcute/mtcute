import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'

import { BusinessWorkHours, businessWorkHoursDaysToRaw } from './business-work-hours.js'

describe('BusinessWorkHours', () => {
    describe('days', () => {
        const mkHours = (intervals: [number, number][]) =>
            createStub('businessWorkHours', {
                weeklyOpen: intervals.map(([start, end]) =>
                    createStub('businessWeeklyOpen', {
                        startMinute: start,
                        endMinute: end,
                    }),
                ),
            })

        it('should handle a single interval on Monday', () => {
            const it = new BusinessWorkHours(mkHours([[0, 60]]))

            expect(it.days).toEqual([
                { day: 0, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 }] },
                { day: 1, is24h: false, intervals: [] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle a single interval on Tuesday', () => {
            const it = new BusinessWorkHours(mkHours([[1440, 1500]]))

            expect(it.days).toEqual([
                { day: 0, is24h: false, intervals: [] },
                { day: 1, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 }] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle multiple intervals within a day', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    [0, 60],
                    [120, 180],
                ]),
            )

            expect(it.days).toEqual([
                {
                    day: 0,
                    is24h: false,
                    intervals: [
                        { startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 },
                        { startHour: 2, startMinute: 0, endHour: 3, endMinute: 0 },
                    ],
                },
                { day: 1, is24h: false, intervals: [] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle multiple intervals across different days', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    [0, 60],
                    [25 * 60 + 30, 26 * 60 + 30],
                ]),
            )

            expect(it.days).toEqual([
                { day: 0, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 }] },
                { day: 1, is24h: false, intervals: [{ startHour: 1, startMinute: 30, endHour: 2, endMinute: 30 }] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle a single interval spanning multiple days', () => {
            const it = new BusinessWorkHours(mkHours([[0, 1500]]))

            expect(it.days).toEqual([
                { day: 0, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 1, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 }] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle a single 7-day interval', () => {
            const it = new BusinessWorkHours(mkHours([[0, 7 * 24 * 60]]))

            expect(it.days).toEqual([
                { day: 0, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 1, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 2, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 3, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 4, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 5, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 6, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
            ])
        })

        it('should handle multiple intervals each spanning multiple days', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    [0, 2 * 24 * 60],
                    [4 * 24 * 60, 6 * 24 * 60],
                ]),
            )

            expect(it.days).toEqual([
                { day: 0, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 1, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 5, is24h: true, intervals: [{ startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 }] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle overlapping intervals', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    [0, 60],
                    [30, 90],
                ]),
            )

            expect(it.days).toEqual([
                { day: 0, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 30 }] },
                { day: 1, is24h: false, intervals: [] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle adjascent intervals', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    [0, 60],
                    [60, 90],
                ]),
            )

            expect(it.days).toEqual([
                { day: 0, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 30 }] },
                { day: 1, is24h: false, intervals: [] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [] },
            ])
        })

        it('should handle magic 8th day', () => {
            const it = new BusinessWorkHours(
                mkHours([
                    // Mon 12:00 - 14:00
                    [12 * 60, 14 * 60],
                    // Sun 0:00 - Mon (next week) 2:00
                    [6 * 24 * 60 + 20 * 60, 7 * 24 * 60 + 2 * 60],
                    // Mon (next week) 3:00 - Mon (next week) 4:00
                    [7 * 24 * 60 + 3 * 60, 7 * 24 * 60 + 4 * 60],
                ]),
            )

            expect(it.days).toEqual([
                {
                    day: 0,
                    is24h: false,
                    intervals: [
                        { startHour: 0, startMinute: 0, endHour: 2, endMinute: 0 },
                        { startHour: 3, startMinute: 0, endHour: 4, endMinute: 0 },
                        { startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 },
                    ],
                },
                { day: 1, is24h: false, intervals: [] },
                { day: 2, is24h: false, intervals: [] },
                { day: 3, is24h: false, intervals: [] },
                { day: 4, is24h: false, intervals: [] },
                { day: 5, is24h: false, intervals: [] },
                { day: 6, is24h: false, intervals: [{ startHour: 20, startMinute: 0, endHour: 24, endMinute: 0 }] },
            ])
        })
    })

    describe('businessWorkHoursDaysToRaw', () => {
        it('should handle 24-hour days', () => {
            expect(businessWorkHoursDaysToRaw([{ day: 0, is24h: true, intervals: [] }])).toEqual([
                { _: 'businessWeeklyOpen', startMinute: 0, endMinute: 1440 },
            ])
        })

        it('should handle intervals', () => {
            expect(
                businessWorkHoursDaysToRaw([
                    { day: 0, is24h: false, intervals: [{ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 }] },
                    { day: 3, is24h: false, intervals: [{ startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 }] },
                ]),
            ).toEqual([
                { _: 'businessWeeklyOpen', startMinute: 0, endMinute: 60 },
                { _: 'businessWeeklyOpen', startMinute: 3 * 24 * 60 + 12 * 60, endMinute: 3 * 24 * 60 + 14 * 60 },
            ])
        })
    })
})
