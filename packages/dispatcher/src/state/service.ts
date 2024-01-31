import { asyncResettable, LruMap } from '@mtcute/core/utils.js'

import { IStateStorageProvider } from './provider.js'

const makeCurrentSceneKey = (key: string) => `$current_scene_${key}`

export class StateService {
    constructor(readonly provider: IStateStorageProvider) {}

    private _cache: LruMap<string, unknown> = new LruMap(100)
    private _vacuumTimer?: NodeJS.Timeout

    private _loaded = false
    private _load = asyncResettable(async () => {
        await this.provider.driver.load?.()
        this._loaded = true
    })
    async load() {
        await this._load.run()
        this._vacuumTimer = setInterval(() => {
            Promise.resolve(this.provider.state.vacuum(Date.now()))
                .catch(() => {})
        }, 300_000)
    }

    async destroy() {
        await this.provider.driver.save?.()
        await this.provider.driver.destroy?.()
        clearInterval(this._vacuumTimer!)
        this._loaded = false
    }

    async getState<T>(key: string): Promise<T | null> {
        if (!this._loaded) await this.load()

        const cached = this._cache.get(key)
        if (cached) return cached as T

        const state = await this.provider.state.getState(key, Date.now())
        if (!state) return null

        return JSON.parse(state) as T
    }

    async setState<T>(key: string, state: T, ttl?: number): Promise<void> {
        if (!this._loaded) await this.load()

        this._cache.set(key, state)
        await this.provider.state.setState(key, JSON.stringify(state), ttl)
    }

    async deleteState(key: string): Promise<void> {
        if (!this._loaded) await this.load()

        this._cache.delete(key)
        await this.provider.state.deleteState(key)
    }

    getCurrentScene(key: string): Promise<string | null> {
        return this.getState(makeCurrentSceneKey(key))
    }

    setCurrentScene(key: string, scene: string, ttl?: number): Promise<void> {
        return this.setState(makeCurrentSceneKey(key), scene, ttl)
    }

    deleteCurrentScene(key: string): Promise<void> {
        return this.deleteState(makeCurrentSceneKey(key))
    }

    getRateLimit(key: string, limit: number, window: number) {
        return this.provider.state.getRateLimit(key, Date.now(), limit, window)
    }

    resetRateLimit(key: string) {
        return this.provider.state.resetRateLimit(key)
    }
}
