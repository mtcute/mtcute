import { describe, it } from 'mocha'
import { expect } from 'chai'
import { LruMap } from '../src'

describe('LruMap', () => {
    it('Map backend', () => {
        const lru = new LruMap<string, number>(2)

        lru.set('first', 1)
        expect(lru.has('first')).true
        expect(lru.has('second')).false
        expect(lru.get('first')).eq(1)

        lru.set('first', 42)
        expect(lru.has('first')).true
        expect(lru.has('second')).false
        expect(lru.get('first')).eq(42)

        lru.set('second', 2)
        expect(lru.has('first')).true
        expect(lru.has('second')).true
        expect(lru.get('first')).eq(42)
        expect(lru.get('second')).eq(2)

        lru.set('third', 3)
        expect(lru.has('first')).false
        expect(lru.has('second')).true
        expect(lru.has('third')).true
        expect(lru.get('first')).eq(undefined)
        expect(lru.get('second')).eq(2)
        expect(lru.get('third')).eq(3)

        lru.get('second') // update lru so that last = third
        lru.set('fourth', 4)
        expect(lru.has('first')).false
        expect(lru.has('second')).true
        expect(lru.has('third')).false
        expect(lru.has('fourth')).true
        expect(lru.get('first')).eq(undefined)
        expect(lru.get('second')).eq(2)
        expect(lru.get('third')).eq(undefined)
        expect(lru.get('fourth')).eq(4)
    })

    it('Object backend', () => {
        const lru = new LruMap<string, number>(2, true)

        lru.set('first', 1)
        expect(lru.has('first')).true
        expect(lru.has('second')).false
        expect(lru.get('first')).eq(1)

        lru.set('first', 42)
        expect(lru.has('first')).true
        expect(lru.has('second')).false
        expect(lru.get('first')).eq(42)

        lru.set('second', 2)
        expect(lru.has('first')).true
        expect(lru.has('second')).true
        expect(lru.get('first')).eq(42)
        expect(lru.get('second')).eq(2)

        lru.set('third', 3)
        expect(lru.has('first')).false
        expect(lru.has('second')).true
        expect(lru.has('third')).true
        expect(lru.get('first')).eq(undefined)
        expect(lru.get('second')).eq(2)
        expect(lru.get('third')).eq(3)

        lru.get('second') // update lru so that last = third
        lru.set('fourth', 4)
        expect(lru.has('first')).false
        expect(lru.has('second')).true
        expect(lru.has('third')).false
        expect(lru.has('fourth')).true
        expect(lru.get('first')).eq(undefined)
        expect(lru.get('second')).eq(2)
        expect(lru.get('third')).eq(undefined)
        expect(lru.get('fourth')).eq(4)
    })
})
