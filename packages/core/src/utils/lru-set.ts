/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// ^^ because of performance reasons
import Long from 'long'

import { LongSet } from './long-utils.js'

interface OneWayLinkedList<T> {
    v: T
    n?: OneWayLinkedList<T>
}

/**
 * Simple class implementing LRU-like behaviour for a Set.
 *
 * Note: this is not exactly LRU, but rather "least recently added"
 * and doesn't mark items as recently added if they are already in the set.
 * This is enough for our use case, so we don't bother with more complex implementation.
 *
 * Used to store recently received message IDs in {@link SessionConnection}
 *
 * Uses one-way linked list internally to keep track of insertion order
 */
export class LruSet<T extends string | number | Long> {
    private _capacity: number
    private _first?: OneWayLinkedList<T>
    private _last?: OneWayLinkedList<T>

    private _set: Set<T> | LongSet

    constructor(capacity: number, forLong = false) {
        this._capacity = capacity

        this._set = forLong ? new LongSet() : new Set()
    }

    clear() {
        this._first = this._last = undefined
        this._set.clear()
    }

    add(val: T) {
        if (this._set.has(val as any)) return

        if (!this._first) this._first = { v: val }

        if (!this._last) this._last = this._first
        else {
            this._last.n = { v: val }
            this._last = this._last.n
        }

        this._set.add(val as any)

        if (this._set.size > this._capacity && this._first) {
            // remove least recently used
            this._set.delete(this._first.v as any)
            this._first = this._first.n
        }
    }

    has(val: T) {
        return this._set.has(val as any)
    }
}
