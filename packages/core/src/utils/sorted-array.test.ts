import { describe, expect, it } from 'vitest'

import { SortedArray } from './sorted-array.js'

describe('SortedArray', () => {
  const ascendingComparator = (a: number, b: number) => a - b

  it('should insert items in accordance with comparator', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)
    arr.insert(3)
    arr.insert(4)

    expect(arr.raw).toEqual([1, 2, 3, 4, 5])
  })

  it('should insert arrays', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert([1, 2, 5, 3, 4])

    expect(arr.raw).toEqual([1, 2, 3, 4, 5])
  })

  it('should return length', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)

    expect(arr.length).toEqual(3)
  })

  it('should return index of the item', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)

    expect(arr.index(1)).toEqual(0)
    expect(arr.index(2)).toEqual(1)
    expect(arr.index(5)).toEqual(2)
    expect(arr.index(10)).toEqual(-1)
  })

  it('should return closest index for an item not in the array', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)

    expect(arr.index(3, true)).toEqual(2)
    expect(arr.index(4, true)).toEqual(2) // still 2, becuse left-hand side
    expect(arr.index(6, true)).toEqual(3)
  })

  it('should remove items by value', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)
    arr.remove(2)

    expect(arr.raw).toEqual([1, 5])
  })

  it('should check if item is in array', () => {
    const arr = new SortedArray<number>([], ascendingComparator)

    arr.insert(1)
    arr.insert(2)
    arr.insert(5)

    expect(arr.includes(1)).toBeTruthy()
    expect(arr.includes(2)).toBeTruthy()
    expect(arr.includes(5)).toBeTruthy()
    expect(arr.includes(10)).toBeFalsy()
  })

  it('should correctly remove items with equal comparator value', () => {
    interface Value { n: number, item: number }

    const val1: Value = { n: 1, item: 1 }
    const val2: Value = { n: 1, item: 2 }

    const arr = new SortedArray<Value>([], (a, b) => a.n - b.n)

    arr.insert(val1)
    arr.insert(val2)

    expect(arr.raw.length).toBe(2)
    expect(arr.raw).toEqual([val1, val2])

    arr.remove(val1)

    expect(arr.raw.length).toBe(1)
    expect(arr.raw).toEqual([val2])
  })
})
