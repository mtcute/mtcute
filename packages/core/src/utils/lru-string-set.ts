interface OneWayLinkedList<T> {
    v: T
    n?: OneWayLinkedList<T>
}

/**
 * Simple class implementing LRU-like behaviour for a set
 * of strings, falling back to objects when `Set` is not available.
 *
 * Used to store recently received message IDs in {@link TelegramConnection}
 *
 * Uses one-way linked list internally to keep track of insertion order
 *
 * @internal
 */
export class LruStringSet {
    private _capacity: number
    private _first?: OneWayLinkedList<string>
    private _last?: OneWayLinkedList<string>

    private _set?: Set<string>
    private _obj?: Record<string, true>
    private _objSize?: number

    constructor(capacity: number, useObject = false) {
        this._capacity = capacity

        if (typeof Set === 'undefined' || useObject) {
            this._obj = {}
            this._objSize = 0
            this.add = this._addForObj.bind(this)
            this.has = this._hasForObj.bind(this)
        } else {
            this._set = new Set()
            this.add = this._addForSet.bind(this)
            this.has = this._hasForSet.bind(this)
        }
    }

    add: (str: string) => void
    has: (str: string) => boolean

    private _addForSet(str: string) {
        if (this._set!.has(str)) return

        if (!this._first) this._first = { v: str }
        if (!this._last) this._last = this._first
        else {
            this._last.n = { v: str }
            this._last = this._last.n
        }

        this._set!.add(str)

        if (this._set!.size > this._capacity && this._first) {
            // remove least recently used
            this._set!.delete(this._first.v)
            this._first = this._first.n
        }
    }

    private _hasForSet(str: string) {
        return this._set!.has(str)
    }

    private _addForObj(str: string) {
        if (str in this._obj!) return

        if (!this._first) this._first = { v: str }
        if (!this._last) this._last = this._first
        else {
            this._last.n = { v: str }
            this._last = this._last.n
        }

        this._obj![str] = true

        if (this._objSize === this._capacity) {
            // remove least recently used
            delete this._obj![this._first.v]
            this._first = this._first.n
        } else {
            this._objSize! += 1
        }
    }

    private _hasForObj(str: string) {
        return str in this._obj!
    }
}
