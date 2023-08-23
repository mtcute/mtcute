import { tl } from '@mtcute/tl'

export class ConfigManager {
    constructor(private _update: () => Promise<tl.RawConfig>) {}

    private _destroyed = false
    private _config?: tl.RawConfig
    private _cdnConfig?: tl.RawCdnConfig

    private _updateTimeout?: NodeJS.Timeout
    private _updatingPromise?: Promise<void>

    private _listeners: ((config: tl.RawConfig) => void)[] = []

    get isStale(): boolean {
        return !this._config || this._config.expires < Date.now() / 1000
    }

    update(force = false): Promise<void> {
        if (!force && !this.isStale) return Promise.resolve()
        if (this._updatingPromise) return this._updatingPromise

        return (this._updatingPromise = this._update().then((config) => {
            if (this._destroyed) return

            this.setConfig(config)
        }))
    }

    setConfig(config: tl.RawConfig): void {
        this._config = config

        if (this._updateTimeout) clearTimeout(this._updateTimeout)
        this._updateTimeout = setTimeout(
            () => this.update(),
            (config.expires - Date.now() / 1000) * 1000,
        )

        for (const cb of this._listeners) cb(config)
    }

    onConfigUpdate(cb: (config: tl.RawConfig) => void): void {
        this._listeners.push(cb)
    }

    offConfigUpdate(cb: (config: tl.RawConfig) => void): void {
        const idx = this._listeners.indexOf(cb)
        if (idx >= 0) this._listeners.splice(idx, 1)
    }

    getNow(): tl.RawConfig | undefined {
        return this._config
    }

    async get(): Promise<tl.RawConfig> {
        if (this.isStale) await this.update()

        return this._config!
    }

    destroy(): void {
        if (this._updateTimeout) clearTimeout(this._updateTimeout)
        this._listeners.length = 0
        this._destroyed = true
    }

    async findOption(params: {
        dcId: number
        allowIpv6?: boolean
        preferIpv6?: boolean
        allowMedia?: boolean
        preferMedia?: boolean
        cdn?: boolean
    }): Promise<tl.RawDcOption | undefined> {
        if (this.isStale) await this.update()

        const options = this._config!.dcOptions.filter((opt) => {
            if (opt.tcpoOnly) return false // unsupported
            if (opt.ipv6 && !params.allowIpv6) return false
            if (opt.mediaOnly && !params.allowMedia) return false
            if (opt.cdn && !params.cdn) return false

            return opt.id === params.dcId
        })

        if (params.preferMedia && params.preferIpv6) {
            const r = options.find((opt) => opt.mediaOnly && opt.ipv6)
            if (r) return r
        }

        if (params.preferMedia) {
            const r = options.find((opt) => opt.mediaOnly)
            if (r) return r
        }

        if (params.preferIpv6) {
            const r = options.find((opt) => opt.ipv6)
            if (r) return r
        }

        return options[0]
    }
}
