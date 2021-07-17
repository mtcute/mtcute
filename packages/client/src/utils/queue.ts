interface OneWayLinkedListItem<T> {
    v: T
    n?: OneWayLinkedListItem<T>
}

export class Queue<T> {
    first?: OneWayLinkedListItem<T>
    last?: OneWayLinkedListItem<T>

    length = 0

    constructor(readonly limit = 0) {}

    push(item: T): void {
        const it: OneWayLinkedListItem<T> = { v: item }
        if (!this.first) {
            this.first = this.last = it
        } else {
            this.last!.n = it
            this.last = it
        }

        this.length += 1

        if (this.limit) {
            while (this.first && this.length > this.limit) {
                this.first = this.first.n
                this.length -= 1
            }
        }
    }

    empty(): boolean {
        return this.first === undefined
    }

    peek(): T | undefined {
        return this.first?.v
    }

    pop(): T | undefined {
        if (!this.first) return undefined

        const it = this.first
        this.first = this.first.n
        if (!this.first) this.last = undefined

        this.length -= 1
        return it.v
    }

    removeBy(pred: (it: T) => boolean): void {
        if (!this.first) return

        let prev: OneWayLinkedListItem<T> | undefined = undefined
        let it = this.first
        while (it && !pred(it.v)) {
            if (!it.n) return

            prev = it
            it = it.n
        }

        if (!it) return

        if (prev) {
            prev.n = it.n
        } else {
            this.first = it.n
        }

        if (!this.first) this.last = undefined

        this.length -= 1
    }

    clear(): void {
        this.first = this.last = undefined
        this.length = 0
    }
}
