/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// ^^ because of performance reasons
import { LongMap } from './long-utils.js'

interface TwoWayLinkedList<K, T> {
    // k = key
    k: K
    // v = value
    v: T
    // p = previous
    p?: TwoWayLinkedList<K, T>
    // n = next
    n?: TwoWayLinkedList<K, T>
}

/**
 * Simple class implementing LRU-like behaviour for a Map
 *
 * Can be used to handle local cache of *something*
 *
 * Uses two-way linked list internally to keep track of insertion/access order
 */
export class LruMap<K extends string | number, V> {
    private _capacity: number
    private _first?: TwoWayLinkedList<K, V>
    private _last?: TwoWayLinkedList<K, V>

    private _map: Map<K, TwoWayLinkedList<K, V>>

    private _size = 0

    constructor(capacity: number, forLong = false) {
        this._capacity = capacity

        this._map = forLong ? (new LongMap() as any) : new Map()
    }

    private _markUsed(item: TwoWayLinkedList<K, V>): void {
        if (item === this._first) {
            return // already the most recently used
        }

        if (item.p) {
            if (item === this._last) {
                this._last = item.p
            }
            item.p.n = item.n
        }

        if (item.n) {
            item.n.p = item.p
        }

        item.p = undefined
        item.n = this._first

        if (this._first) {
            this._first.p = item
        }
        this._first = item
    }

    get(key: K): V | undefined {
        const item = this._map.get(key)
        if (!item) return undefined

        this._markUsed(item)

        return item.v
    }

    has(key: K): boolean {
        return this._map.has(key)
    }

    private _remove(item: TwoWayLinkedList<K, V>): void {
        if (item.p) {
            this._last = item.p
            this._last.n = undefined
        } else {
            // exhausted
            this._last = undefined
            this._first = undefined
        }

        // remove strong refs to and from the item
        item.p = item.n = undefined
        this._map.delete(item.k)
        this._size -= 1
    }

    set(key: K, value: V): void {
        let item = this._map.get(key)

        if (item) {
            // already in cache, update
            item.v = value
            this._markUsed(item)

            return
        }

        item = {
            k: key,
            v: value,
            // for jit to optimize stuff
            n: undefined,
            p: undefined,
        }
        this._map.set(key, item as any)

        if (this._first) {
            this._first.p = item
            item.n = this._first
        } else {
            // first item ever
            this._last = item
        }

        this._first = item
        this._size += 1

        if (this._size > this._capacity) {
            // remove the last item
            const oldest = this._last

            if (oldest) {
                this._remove(oldest)
            }
        }
    }

    delete(key: K): void {
        const item = this._map.get(key)
        if (item) this._remove(item)
    }

    clear(): void {
        this._map.clear()
        this._first = undefined
        this._last = undefined
        this._size = 0
    }
}
