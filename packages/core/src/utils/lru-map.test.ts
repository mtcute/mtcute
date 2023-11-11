import { describe, expect, it } from 'vitest'

import { LruMap } from './lru-map.js'

describe('LruMap', () => {
    it('should maintain maximum size by removing oldest added', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)
        lru.set('third', 3)

        expect(lru.has('first')).toBeFalsy()
    })

    it('should update the last added item', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)
        lru.set('first', 42)
        lru.set('third', 3)

        expect(lru.get('first')).toEqual(42)
        expect(lru.has('second')).toBeFalsy()
    })

    it('should update the last used item', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)
        lru.get('first')
        lru.set('third', 3)
        lru.get('third')

        expect(lru.get('first')).toEqual(1)
        expect(lru.has('second')).toBeFalsy()
    })

    it('should allow deleting items', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)
        lru.set('third', 3) // first is now deleted
        lru.delete('second')

        expect(lru.has('first')).toBeFalsy()
        expect(lru.has('second')).toBeFalsy()
        expect(lru.has('third')).toBeTruthy()
    })

    it('should handle deleting all items', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)
        lru.delete('second')
        lru.delete('first')

        expect(lru.has('first')).toBeFalsy()
        expect(lru.has('second')).toBeFalsy()
    })

    it('should return undefined for non-existing items', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        lru.set('second', 2)

        expect(lru.get('third')).toEqual(undefined)
    })

    // it('Map backend', () => {
    //     const lru = new LruMap<string, number>(2)
    //
    //     lru.set('first', 1)
    //     expect(lru.has('first')).true
    //     expect(lru.has('second')).false
    //     expect(lru.get('first')).eq(1)
    //
    //     lru.set('first', 42)
    //     expect(lru.has('first')).true
    //     expect(lru.has('second')).false
    //     expect(lru.get('first')).eq(42)
    //
    //     lru.set('second', 2)
    //     expect(lru.has('first')).true
    //     expect(lru.has('second')).true
    //     expect(lru.get('first')).eq(42)
    //     expect(lru.get('second')).eq(2)
    //
    //     lru.set('third', 3)
    //     expect(lru.has('first')).false
    //     expect(lru.has('second')).true
    //     expect(lru.has('third')).true
    //     expect(lru.get('first')).eq(undefined)
    //     expect(lru.get('second')).eq(2)
    //     expect(lru.get('third')).eq(3)
    //
    //     lru.get('second') // update lru so that last = third
    //     lru.set('fourth', 4)
    //     expect(lru.has('first')).false
    //     expect(lru.has('second')).true
    //     expect(lru.has('third')).false
    //     expect(lru.has('fourth')).true
    //     expect(lru.get('first')).eq(undefined)
    //     expect(lru.get('second')).eq(2)
    //     expect(lru.get('third')).eq(undefined)
    //     expect(lru.get('fourth')).eq(4)
    // })
})
