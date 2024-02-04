import { asyncResettable } from './function-utils.js'

export interface ReloadableParams<Data> {
    reload: (old?: Data) => Promise<Data>
    getExpiresAt: (data: Data) => number
    onError?: (err: unknown) => void
    disableAutoReload?: boolean
}

export class Reloadable<Data> {
    constructor(readonly params: ReloadableParams<Data>) {}

    protected _data?: Data
    protected _expiresAt = 0
    protected _listeners: ((data: Data) => void)[] = []
    protected _timeout?: NodeJS.Timeout

    private _reload = asyncResettable(async () => {
        const data = await this.params.reload(this._data)
        this.setData(data)

        this._listeners.forEach((cb) => cb(data))
    })

    get isStale(): boolean {
        return !this._data || this._expiresAt <= Date.now()
    }

    setData(data: Data): void {
        const expiresAt = this.params.getExpiresAt(data)

        this._data = data
        this._expiresAt = expiresAt

        if (this._timeout) clearTimeout(this._timeout)

        if (!this.params.disableAutoReload) {
            this._timeout = setTimeout(() => {
                this._reload.reset()
                this.update().catch((err: unknown) => {
                    this.params.onError?.(err)
                })
            }, expiresAt - Date.now())
        }
    }

    update(force = false): Promise<void> {
        if (!force && !this.isStale) return Promise.resolve()

        return this._reload.run()
    }

    onReload(cb: (data: Data) => void): void {
        this._listeners.push(cb)
    }

    offReload(cb: (data: Data) => void): void {
        const idx = this._listeners.indexOf(cb)
        if (idx >= 0) this._listeners.splice(idx, 1)
    }

    getNow(): Data | undefined {
        return this._data
    }

    async get(): Promise<Data> {
        await this.update()

        return this._data!
    }

    destroy(): void {
        if (this._timeout) clearTimeout(this._timeout)
        this._listeners.length = 0
        this._reload.reset()
    }
}
