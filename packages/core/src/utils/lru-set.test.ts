import Long from 'long'
import { describe, expect, it } from 'vitest'

import { LruSet } from './lru-set.js'

describe('LruSet', () => {
    describe('for strings', () => {
        it('when 1 item is added, it is in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            expect(set.has('first')).toEqual(true)
        })

        it('when =capacity items are added, they are all in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')

            expect(set.has('first')).toEqual(true)
            expect(set.has('second')).toEqual(true)
        })

        it('when >capacity items are added, only the last <capacity> are in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')
            set.add('third')

            expect(set.has('first')).toEqual(false)
            expect(set.has('second')).toEqual(true)
            expect(set.has('third')).toEqual(true)
        })

        it('when the same added is while not eliminated, it is ignored', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')
            set.add('first')
            set.add('third')

            expect(set.has('first')).toEqual(false)
            expect(set.has('second')).toEqual(true)
            expect(set.has('third')).toEqual(true)
        })
    })

    describe('for Longs', () => {
        it('when 1 item is added, it is in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            expect(set.has(Long.fromNumber(1))).toEqual(true)
        })

        it('when =capacity items are added, they are all in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))

            expect(set.has(Long.fromNumber(1))).toEqual(true)
            expect(set.has(Long.fromNumber(2))).toEqual(true)
        })

        it('when >capacity items are added, only the last <capacity> are in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))
            set.add(Long.fromNumber(3))

            expect(set.has(Long.fromNumber(1))).toEqual(false)
            expect(set.has(Long.fromNumber(2))).toEqual(true)
            expect(set.has(Long.fromNumber(3))).toEqual(true)
        })

        it('when the same added is while not eliminated, it is ignored', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))
            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(3))

            expect(set.has(Long.fromNumber(1))).toEqual(false)
            expect(set.has(Long.fromNumber(2))).toEqual(true)
            expect(set.has(Long.fromNumber(3))).toEqual(true)
        })
    })
})
