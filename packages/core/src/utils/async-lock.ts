type LockInfo = [Promise<void>, () => void]
interface OneWayLinkedList<T> {
    v: T
    n?: OneWayLinkedList<T>
}

/**
 * Simple class implementing a semaphore like
 * behaviour.
 */
export class AsyncLock {
    private _first?: OneWayLinkedList<LockInfo>
    private _last?: OneWayLinkedList<LockInfo>

    async acquire(): Promise<void> {
        while (this._first) {
            await this._first.v[0]
        }

        let unlock: () => void
        const prom = new Promise<void>((resolve) => {
            unlock = resolve
        })

        if (this._last) {
            this._last.n = { v: [prom, unlock!] }
            this._last = this._last.n
        } else {
            this._first = this._last = { v: [prom, unlock!] }
        }
    }

    release(): void {
        if (!this._first) throw new Error('Nothing to release')
        this._first.v[1]()
        this._first = this._first.n
        if (!this._first) this._last = undefined
    }
}
