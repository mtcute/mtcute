import Long from 'long'
import { describe, expect, it } from 'vitest'

import { LruSet } from './lru-set.js'

describe('LruSet', () => {
    describe('for strings', () => {
        it('when 1 item is added, it is in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            expect(set.has('first')).true
        })

        it('when =capacity items are added, they are all in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')

            expect(set.has('first')).true
            expect(set.has('second')).true
        })

        it('when >capacity items are added, only the last <capacity> are in the set', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')
            set.add('third')

            expect(set.has('first')).false
            expect(set.has('second')).true
            expect(set.has('third')).true
        })

        it('when the same added is while not eliminated, it is ignored', () => {
            const set = new LruSet(2)

            set.add('first')
            set.add('second')
            set.add('first')
            set.add('third')

            expect(set.has('first')).false
            expect(set.has('second')).true
            expect(set.has('third')).true
        })
    })

    describe('for Longs', () => {
        it('when 1 item is added, it is in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            expect(set.has(Long.fromNumber(1))).true
        })

        it('when =capacity items are added, they are all in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))

            expect(set.has(Long.fromNumber(1))).true
            expect(set.has(Long.fromNumber(2))).true
        })

        it('when >capacity items are added, only the last <capacity> are in the set', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))
            set.add(Long.fromNumber(3))

            expect(set.has(Long.fromNumber(1))).false
            expect(set.has(Long.fromNumber(2))).true
            expect(set.has(Long.fromNumber(3))).true
        })

        it('when the same added is while not eliminated, it is ignored', () => {
            const set = new LruSet(2, true)

            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(2))
            set.add(Long.fromNumber(1))
            set.add(Long.fromNumber(3))

            expect(set.has(Long.fromNumber(1))).false
            expect(set.has(Long.fromNumber(2))).true
            expect(set.has(Long.fromNumber(3))).true
        })
    })
})
