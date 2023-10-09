interface LinkedListItem<T> {
    v: T
    n?: LinkedListItem<T>
    p?: LinkedListItem<T>
}

/**
 * A sorted linked list.
 */
export class SortedLinkedList<T> {
    _first?: LinkedListItem<T>
    _last?: LinkedListItem<T>
    _size = 0

    constructor(private comparator: (a: T, b: T) => number) {}

    get length(): number {
        return this._size
    }

    _remove(item: LinkedListItem<T>): void {
        if (this._first === item) {
            this._first = item.n
        }

        if (this._last === item) {
            this._last = item.p
        }

        if (item.p) item.p.n = item.n
        if (item.n) item.n.p = item.p

        this._size -= 1
    }

    popFront(): T | undefined {
        if (!this._first) return undefined

        const it = this._first
        this._first = this._first.n
        if (!this._first) this._last = undefined

        this._size -= 1

        return it.v
    }

    add(item: T): void {
        const it: LinkedListItem<T> = { v: item }

        if (!this._first) {
            this._first = this._last = it
        } else {
            let cur: LinkedListItem<T> | undefined = this._first

            while (cur && this.comparator(cur.v, it.v) < 0) {
                cur = cur.n
            }

            if (!cur) {
                // reached end, the item should be new last

                this._last!.n = it
                it.p = this._last
                this._last = it
            } else {
                // `cur` is the first item greater or equal than the given
                it.n = cur
                it.p = cur.p
                if (cur.p) cur.p.n = it
                cur.p = it

                if (cur === this._first) this._first = it
            }
        }

        this._size += 1
    }

    clear(): void {
        this._first = this._last = undefined
        this._size = 0
    }
}
