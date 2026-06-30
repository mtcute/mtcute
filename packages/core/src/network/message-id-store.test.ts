import Long from 'long'
import { describe, expect, it } from 'vitest'

import { MessageIdStore } from './message-id-store.js'

const id = (n: number) => Long.fromNumber(n)

describe('MessageIdStore', () => {
  it('accepts new ids and rejects duplicates', () => {
    const store = new MessageIdStore()
    expect(store.add(id(100))).toBe(true)
    expect(store.add(id(100))).toBe(false)
    expect(store.has(id(100))).toBe(true)
    expect(store.has(id(200))).toBe(false)
  })

  it('rejects ids below the floor once full', () => {
    const store = new MessageIdStore()
    for (let i = 1; i <= 1000; i++) store.add(id(i * 10))

    // smallest saved is 10; anything below it is too old
    expect(store.add(id(5))).toBe(false)
    expect(store.has(id(5))).toBe(false)

    // a newer id is accepted and evicts the smallest (10)
    expect(store.add(id(100000))).toBe(true)
    expect(store.has(id(10))).toBe(false)
    // 5 is now above the new floor (20), but was never inserted
    expect(store.add(id(5))).toBe(false)
  })

  it('does not apply the floor until full', () => {
    const store = new MessageIdStore()
    store.add(id(500))
    expect(store.add(id(1))).toBe(true)
    expect(store.has(id(1))).toBe(true)
  })

  it('clears all ids', () => {
    const store = new MessageIdStore()
    store.add(id(1))
    store.clear()
    expect(store.has(id(1))).toBe(false)
    expect(store.add(id(1))).toBe(true)
  })
})
