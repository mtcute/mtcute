// ^^ because of performance reasons
const MIN_INITIAL_CAPACITY = 8

// System.arraycopy from java
function arraycopy<T>(src: T[], srcPos: number, dest: T[], destPos: number, length: number) {
    for (let i = 0; i < length; i++) {
        dest[destPos + i] = src[srcPos + i]
    }
}

/**
 * Deque implementation.
 * `undefined` values are not allowed
 *
 * Based on Java implementation
 */
export class Deque<T> {
    // another implementation variant would be to use
    // blocks of fixed size instead of a single array
    // to avoid copying stuff around
    protected _elements: (T | undefined)[]
    protected _head = 0
    protected _tail = 0
    protected _capacity: number

    constructor(
        readonly maxLength = Infinity,
        minCapacity = maxLength === Infinity ? MIN_INITIAL_CAPACITY : maxLength,
    ) {
        let capacity = minCapacity

        if (capacity < MIN_INITIAL_CAPACITY) {
            capacity = MIN_INITIAL_CAPACITY
        }
        if (capacity !== MIN_INITIAL_CAPACITY) {
            // Find the best power of two to hold elements.
            capacity |= capacity >>> 1
            capacity |= capacity >>> 2
            capacity |= capacity >>> 4
            capacity |= capacity >>> 8
            capacity |= capacity >>> 16
            capacity += 1

            if (capacity < 0) {
                // too many
                capacity >>>= 1
            }
        }

        this._elements = new Array<T | undefined>(capacity)
        this._capacity = capacity
    }

    protected _resize() {
        const p = this._head
        const n = this._capacity
        const r = n - p // number of elements to the right of the head

        const newCapacity = n << 1
        if (newCapacity < 0) throw new Error('Deque is too big')

        const arr = new Array<T | undefined>(newCapacity)

        // copy items to the new array
        // copy head till the end of arr
        arraycopy(this._elements, p, arr, 0, r)
        // copy from start to tail
        arraycopy(this._elements, 0, arr, r, p)

        this._elements = arr
        this._head = 0
        this._tail = n
        this._capacity = newCapacity
    }

    pushBack(item: T): void {
        if (item === undefined) throw new Error('item can not be undefined')

        this._elements[this._tail] = item

        if ((this._tail = (this._tail + 1) & (this._capacity - 1)) === this._head) {
            this._resize()
        }

        if (this.length > this.maxLength) {
            this.popFront()
        }
    }

    pushFront(item: T): void {
        if (item === undefined) throw new Error('item can not be undefined')

        this._elements[(this._head = (this._head - 1) & (this._capacity - 1))] = item

        if (this._head === this._tail) {
            this._resize()
        }

        if (this.length > this.maxLength) {
            this.popBack()
        }
    }

    popFront(): T | undefined {
        const h = this._head
        const res = this._elements[h]
        if (res === undefined) return undefined

        this._elements[h] = undefined
        this._head = (h + 1) & (this._capacity - 1)

        return res
    }

    popBack(): T | undefined {
        const t = (this._tail - 1) & (this._capacity - 1)
        const res = this._elements[t]
        if (res === undefined) return undefined

        this._elements[t] = undefined
        this._tail = t

        return res
    }

    peekFront(): T | undefined {
        return this._elements[this._head]
    }

    peekBack(): T | undefined {
        return this._elements[(this._tail - 1) & (this._capacity - 1)]
    }

    get length(): number {
        return (this._tail - this._head) & (this._capacity - 1)
    }

    toArray(): T[] {
        const sz = this.length
        if (sz === 0) return []

        const arr = new Array(sz)

        if (this._head < this._tail) {
            // copy as-is, head to tail
            arraycopy(this._elements, this._head, arr, 0, sz)
        } else {
            const headPortion = this._capacity - this._head

            // copy from head to end
            arraycopy(this._elements, this._head, arr, 0, headPortion)
            // copy from start to tail
            arraycopy(this._elements, 0, arr, headPortion, this._tail)
        }

        return arr as T[]
    }

    protected _delete(i: number): void {
        const els = this._elements
        const mask = this._capacity - 1
        const h = this._head
        const t = this._tail
        const front = (i - h) & mask
        const back = (t - i) & mask

        if (front < back) {
            if (h <= i) {
                arraycopy(els, h, els, h + 1, front)
            } else {
                // wrap
                arraycopy(els, 0, els, 1, i)
                els[0] = els[mask]
                arraycopy(els, h, els, h + 1, mask - h)
            }
            els[h] = undefined
            this._head = (h + 1) & mask
        } else if (i < t) {
            // copy null tail as well
            arraycopy(els, i + 1, els, i, back)
            this._tail = t - 1
        } else {
            // wrap
            arraycopy(els, i + 1, els, i, mask - i)
            els[mask] = els[0]
            arraycopy(els, 1, els, 0, t)
            this._tail = (t - 1) & mask
        }
    }

    remove(item: T): void {
        const mask = this._capacity - 1
        let i = this._head
        let val: T | undefined

        while ((val = this._elements[i]) !== undefined) {
            if (item === val) {
                this._delete(i)

                return
            }
            i = (i + 1) & mask
        }
    }

    removeBy(pred: (it: T) => boolean): void {
        const mask = this._capacity - 1
        let i = this._head
        let val: T | undefined

        while ((val = this._elements[i]) !== undefined) {
            if (pred(val)) {
                this._delete(i)

                return
            }
            i = (i + 1) & mask
        }
    }

    at(idx: number): T | undefined {
        return this._elements[(this._head + idx) & (this._capacity - 1)]
    }

    *iter(): IterableIterator<T> {
        const sz = this.length
        if (sz === 0) return

        if (this._head < this._tail) {
            // head to tail
            for (let i = 0; i < sz; i++) {
                yield this._elements[this._head + i]!
            }
        } else {
            const headPortion = this._capacity - this._head

            // head to end
            for (let i = 0; i < headPortion; i++) {
                yield this._elements[this._head + i]!
            }
            // start to tail
            for (let i = 0; i < this._tail; i++) {
                yield this._elements[i]!
            }
        }
    }

    clear(): void {
        this._elements = new Array<T | undefined>(this._capacity)
        this._head = this._tail = 0
    }
}
