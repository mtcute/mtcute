import { describe, expect, it } from 'vitest'

import { Deque } from './deque.js'

describe('Deque', () => {
    function setupWrapping() {
        const d = new Deque<number>(Infinity, /* capacity: */ 8)

        for (let i = 1; i <= 7; i++) {
            d.pushBack(i)
        }

        // [1, 2, 3, 4, 5, 6, 7, _]

        d.popFront()
        d.popFront()
        d.popFront()

        // [_, _, _, 4, 5, 6, 7, _]

        d.pushBack(8)
        d.pushBack(9)
        d.pushBack(10)

        // [9, 10, _, 4, 5, 6, 7, 8]
        return d
    }

    it('should push items to the end correctly', () => {
        const d = new Deque<number>()

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)

        expect(d.toArray()).eql([1, 2, 3])
        expect([...d.iter()]).eql([1, 2, 3])
    })

    it('should push items to the start correctly', () => {
        const d = new Deque<number>()

        d.pushFront(1)
        d.pushFront(2)
        d.pushFront(3)

        expect(d.toArray()).eql([3, 2, 1])
    })

    it('should pop items from the end correctly', () => {
        const d = new Deque<number>()

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)

        expect(d.popBack()).eql(3)
        expect(d.popBack()).eql(2)
        expect(d.popBack()).eql(1)
    })

    it('should pop items from the start correctly', () => {
        const d = new Deque<number>()

        d.pushFront(1)
        d.pushFront(2)
        d.pushFront(3)

        expect(d.popFront()).eql(3)
        expect(d.popFront()).eql(2)
        expect(d.popFront()).eql(1)
    })

    it('should return the correct length', () => {
        const d = new Deque<number>()

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)

        expect(d.length).eql(3)
    })

    it('accessors should correctly wrap around', () => {
        const d = setupWrapping()

        expect(d.toArray()).eql([4, 5, 6, 7, 8, 9, 10])
        expect([...d.iter()]).eql([4, 5, 6, 7, 8, 9, 10])
        expect(d.at(6)).eql(10)
    })

    it('should handle maxLength by removing items from the other end', () => {
        const d = new Deque<number>(4)

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)
        d.pushBack(4)

        d.pushBack(5)
        expect(d.toArray()).eql([2, 3, 4, 5])

        d.pushFront(6)
        expect(d.toArray()).eql([6, 2, 3, 4])
    })

    it('should correctly resize', () => {
        const d = new Deque<number>(Infinity, /* capacity: */ 8)

        for (let i = 0; i <= 16; i++) {
            d.pushBack(i)
        }

        const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

        expect(d.length).eql(17)
        expect(d.toArray()).eql(expected)
        expect([...d.iter()]).eql(expected)
        expect(d.at(16)).eql(16)
    })

    it('should correctly remove items', () => {
        const d = new Deque<number>(Infinity, /* capacity: */ 16)

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)
        d.pushBack(4)
        d.pushBack(5)

        d.remove(1)
        d.remove(4)

        expect(d.toArray()).eql([2, 3, 5])
    })

    it('should correctly remove items by predicate (the first matched)', () => {
        const d = new Deque<number>(Infinity, /* capacity: */ 4)

        d.pushBack(1)
        d.pushBack(2)
        d.pushBack(3)
        d.pushBack(4)
        d.pushBack(5)

        d.removeBy((it) => it >= 2)

        expect(d.toArray()).eql([1, 3, 4, 5])
    })

    it('should correctly peek at edges', () => {
        const d = new Deque<number>()

        d.pushBack(1)
        d.pushBack(2)

        expect(d.peekFront()).eql(1)
        expect(d.peekBack()).eql(2)
    })

    it('should correctly clear', () => {
        const d = new Deque<number>()

        d.pushBack(1)
        d.pushBack(2)

        d.clear()

        expect(d.length).eql(0)
        expect(d.toArray()).eql([])
        expect([...d.iter()]).eql([])
    })
})
