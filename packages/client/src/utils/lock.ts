/** @internal */
export class Lock {
    private _prom: Promise<void> | null = null
    private _unlock: (() => void) | null = null

    constructor() {
        this._prom = null
        this._unlock = null
    }

    async acquire(): Promise<void> {
        if (this._prom) await this._prom
        this._prom = new Promise((resolve) => {
            this._unlock = resolve
        })
    }

    release(): void {
        if (!this._unlock) return
        this._unlock()
        this._prom = null
        this._unlock = null
    }
}
