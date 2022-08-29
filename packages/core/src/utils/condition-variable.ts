/**
 * Class implementing a condition variable like behaviour.
 */
export class ConditionVariable {
    private _notify?: () => void
    private _timeout?: NodeJS.Timeout

    wait(timeout?: number): Promise<void> {
        const prom = new Promise<void>((resolve) => {
            this._notify = resolve
        })

        if (timeout) {
            this._timeout = setTimeout(() => {
                this._notify?.()
                this._timeout = undefined
            }, timeout)
        }

        return prom
    }

    notify(): void {
        this._notify?.()
        if (this._timeout) clearTimeout(this._timeout)
        this._notify = undefined
    }
}
