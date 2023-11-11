import { describe, expect, it } from 'vitest'

import { SortedLinkedList } from './linked-list.js'

describe('SortedLinkedList', () => {
    const ascendingComparator = (a: number, b: number) => a - b

    it('should add items in the correct order', () => {
        const list = new SortedLinkedList(ascendingComparator)

        list.add(3)
        list.add(1)
        list.add(2)

        expect(list.popFront()).eq(1)
        expect(list.popFront()).eq(2)
        expect(list.popFront()).eq(3)
    })

    it('should allow deleting nodes using _remove', () => {
        const list = new SortedLinkedList(ascendingComparator)

        list.add(3)
        list.add(1)
        list.add(2)

        const node = list._first!.n!

        list._remove(node)

        expect(list.popFront()).eq(1)
        expect(list.popFront()).eq(3)
    })

    it('should clear', () => {
        const list = new SortedLinkedList(ascendingComparator)

        list.add(3)
        list.add(1)
        list.add(2)

        list.clear()

        expect(list.length).eq(0)
        expect(list.popFront()).eq(undefined)
    })
})
