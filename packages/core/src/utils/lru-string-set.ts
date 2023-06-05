/* eslint-disable @typescript-eslint/no-explicit-any */
// ^^ because of performance reasons
import Long from 'long'

import { LongSet } from './long-utils'

interface OneWayLinkedList<T> {
    v: T
    n?: OneWayLinkedList<T>
}

/**
 * Simple class implementing LRU-like behaviour for a set,
 * falling back to objects when `Set` is not available.
 *
 * Used to store recently received message IDs in {@link SessionConnection}
 *
 * Uses one-way linked list internally to keep track of insertion order
 */
export class LruSet<T extends string | number | Long> {
    private _capacity: number
    private _first?: OneWayLinkedList<T>
    private _last?: OneWayLinkedList<T>

    private _set?: Set<T> | LongSet
    private _obj?: object
    private _objSize?: number

    constructor(capacity: number, useObject = false, forLong = false) {
        this._capacity = capacity

        if (!forLong && (typeof Set === 'undefined' || useObject)) {
            this._obj = Object.create(null)
            this._objSize = 0
            this.add = this._addForObj.bind(this)
            this.has = this._hasForObj.bind(this)
            this.clear = this._clearForObj.bind(this)
        } else {
            this._set = forLong ? new LongSet(useObject) : new Set()
            this.add = this._addForSet.bind(this)
            this.has = this._hasForSet.bind(this)
            this.clear = this._clearForSet.bind(this)
        }
    }

    readonly add: (val: T) => void
    readonly has: (val: T) => boolean
    readonly clear: () => void

    private _clearForSet() {
        this._first = this._last = undefined
        this._set!.clear()
    }

    private _clearForObj() {
        this._first = this._last = undefined
        this._obj = {}
        this._objSize = 0
    }

    private _addForSet(val: T) {
        if (this._set!.has(val as any)) return

        if (!this._first) this._first = { v: val }

        if (!this._last) this._last = this._first
        else {
            this._last.n = { v: val }
            this._last = this._last.n
        }

        this._set!.add(val as any)

        if (this._set!.size > this._capacity && this._first) {
            // remove least recently used
            this._set!.delete(this._first.v as any)
            this._first = this._first.n
        }
    }

    private _hasForSet(val: T) {
        return this._set!.has(val as any)
    }

    private _addForObj(val: T) {
        if ((val as any) in this._obj!) return

        if (!this._first) this._first = { v: val }

        if (!this._last) this._last = this._first
        else {
            this._last.n = { v: val }
            this._last = this._last.n
        }

        (this._obj as any)[val] = true

        if (this._objSize === this._capacity) {
            // remove least recently used
            delete (this._obj as any)[this._first.v]
            this._first = this._first.n
        } else {
            this._objSize! += 1
        }
    }

    private _hasForObj(val: T) {
        return (val as any) in this._obj!
    }
}
