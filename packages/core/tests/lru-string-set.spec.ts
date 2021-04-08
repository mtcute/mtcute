import { describe, it } from 'mocha'
import { expect } from 'chai'
import { LruStringSet } from '../src/utils/lru-string-set'

describe('LruStringSet', () => {
    it('Set backend', () => {
        const set = new LruStringSet(2)

        set.add('first')
        expect(set.has('first')).true

        set.add('second')
        expect(set.has('first')).true
        expect(set.has('second')).true

        set.add('third')
        expect(set.has('first')).false
        expect(set.has('second')).true
        expect(set.has('third')).true

        set.add('third')
        expect(set.has('first')).false
        expect(set.has('second')).true
        expect(set.has('third')).true

        set.add('fourth')
        expect(set.has('first')).false
        expect(set.has('second')).false
        expect(set.has('third')).true
        expect(set.has('fourth')).true
    })

    it('Object backend', () => {
        const set = new LruStringSet(2, true)

        set.add('first')
        expect(set.has('first')).true

        set.add('second')
        expect(set.has('first')).true
        expect(set.has('second')).true

        set.add('third')
        expect(set.has('first')).false
        expect(set.has('second')).true
        expect(set.has('third')).true

        set.add('third')
        expect(set.has('first')).false
        expect(set.has('second')).true
        expect(set.has('third')).true

        set.add('fourth')
        expect(set.has('first')).false
        expect(set.has('second')).false
        expect(set.has('third')).true
        expect(set.has('fourth')).true
    })
})
