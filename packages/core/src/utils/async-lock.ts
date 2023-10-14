import { Deque } from './deque.js'

type LockInfo = [Promise<void>, () => void]

/**
 * Simple class implementing a semaphore like
 * behaviour.
 */
export class AsyncLock {
    private _queue = new Deque<LockInfo>()

    async acquire(): Promise<void> {
        let info

        while ((info = this._queue.peekFront())) {
            await info[0]
        }

        let unlock: () => void
        const prom = new Promise<void>((resolve) => {
            unlock = resolve
        })

        this._queue.pushBack([prom, unlock!])
    }

    release(): void {
        if (!this._queue.length) throw new Error('Nothing to release')

        this._queue.popFront()![1]()
    }

    with(func: () => Promise<void>): Promise<void> {
        let err: unknown = null

        return this.acquire()
            .then(() => func())
            .catch((e) => void (err = e))
            .then(() => {
                this.release()
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                if (err) throw err
            })
    }
}
