import { IStateStorage } from './storage'
import { MtqtArgumentError, MtqtError } from '@mtqt/client'
import { sleep } from '@mtqt/core/src/utils/misc-utils'

/**
 * Error thrown by `.rateLimit()`
 */
export class RateLimitError extends MtqtError {
    constructor (readonly reset: number) {
        super(`You are being rate limited.`)
    }
}

/**
 * State of the current update.
 *
 * @template State  Type that represents the state
 * @template SceneName  Possible scene names
 */
export class UpdateState<State, SceneName extends string = string> {
    private _key: string
    private _localKey: string

    private _storage: IStateStorage

    private _scene: SceneName | null
    private _scoped?: boolean
    private _cached?: State | null

    private _localStorage: IStateStorage
    private _localKeyBase: string

    constructor(
        storage: IStateStorage,
        key: string,
        scene: SceneName | null,
        scoped?: boolean,
        customStorage?: IStateStorage,
        customKey?: string
    ) {
        this._storage = storage
        this._key = key
        this._scene = scene
        this._scoped = scoped

        this._localStorage = customStorage ?? storage
        this._localKeyBase = customKey ?? key

        this._updateLocalKey()
    }

    get scene(): SceneName | null {
        return this._scene
    }

    private _updateLocalKey(): void {
        if (!this._scoped) this._localKey = this._localKeyBase
        else
            this._localKey = this._scene
                ? this._scene + '_' + this._localKeyBase
                : this._localKeyBase
    }

    /**
     * Retrieve the state from the storage, falling back to default
     * if not found
     *
     * @param fallback  Default state value
     * @param force  Whether to ignore cached state (def. `false`)
     */
    async get(fallback: State, force?: boolean): Promise<State>

    /**
     * Retrieve the state from the storage, falling back to default
     * if not found
     *
     * @param fallback  Default state value
     * @param force  Whether to ignore cached state (def. `false`)
     */
    async get(fallback?: State, force?: boolean): Promise<State | null>
    /**
     * Retrieve the state from the storage
     *
     * @param force  Whether to ignore cached state (def. `false`)
     */
    async get(force?: boolean): Promise<State | null>
    async get(
        fallback?: State | boolean,
        force?: boolean
    ): Promise<State | null> {
        if (typeof fallback === 'boolean') {
            force = fallback
            fallback = undefined
        }

        if (!force && this._cached !== undefined) {
            if (!this._cached && fallback) return fallback
            return this._cached
        }

        let res = await this._localStorage.getState(this._localKey)
        if (!res && fallback) res = fallback
        this._cached = res
        return res
    }

    /**
     * Set new state to the storage
     *
     * @param state  New state
     * @param ttl  TTL for the new state (in seconds)
     */
    async set(state: State, ttl?: number): Promise<void> {
        this._cached = state
        await this._localStorage.setState(this._localKey, state, ttl)
    }

    /**
     * Merge the given object to the current state.
     *
     * > **Note**: If the storage currently has no state,
     * > then `state` will be used as-is, which might
     * > result in incorrect typings. Beware!
     *
     * Basically a shorthand to calling `.get()`,
     * modifying and then calling `.set()`
     *
     * @param state  State to be merged
     * @param fallback  Default state
     * @param ttl  TTL for the new state (in seconds)
     * @param forceLoad  Whether to force load the old state from storage
     */
    async merge(state: Partial<State>, fallback?: State, ttl?: number, forceLoad = false): Promise<State> {
        const old = await this.get(forceLoad)
        if (!old) {
            if (!fallback)
                throw new MtqtArgumentError('Cannot use merge on empty state without fallback.')

            await this.set({ ...fallback, ...state }, ttl)
        } else {
            await this.set({ ...old, ...state }, ttl)
        }

        return this._cached!
    }

    /**
     * Delete the state from the storage
     */
    async delete(): Promise<void> {
        this._cached = null
        await this._localStorage.deleteState(this._localKey)
    }

    /**
     * Enter some scene
     *
     * @param scene  Scene name
     * @param ttl  TTL for the scene (in seconds)
     */
    async enter(scene: SceneName, ttl?: number): Promise<void> {
        this._scene = scene
        this._updateLocalKey()
        await this._storage.setCurrentScene(this._key, scene, ttl)
    }

    /**
     * Exit from current scene to the root
     *
     * @param reset
     *     Whether to reset scene state (only applicable in case this is a scoped scene)
     */
    async exit(reset = true): Promise<void> {
        if (reset && this._scoped) await this.delete()
        this._scene = null
        this._updateLocalKey()
        await this._storage.deleteCurrentScene(this._key)
    }

    /**
     * Rate limit some handler.
     *
     * When the rate limit exceeds, {@link RateLimitError} is thrown.
     *
     * This is a simple rate-limiting solution that uses
     * the same key as the state. If you need something more
     * sophisticated and/or customizable, you'll have to implement
     * your own rate-limiter.
     *
     * > **Note**: `key` is used to prefix the local key
     * > derived using the given key delegate.
     *
     * @param key  Key of the rate limit
     * @param limit  Maximum number of requests in `window`
     * @param window  Window size in seconds
     * @returns  Tuple containing the number of remaining and
     *   unix time in ms when the user can try again
     */
    async rateLimit(key: string, limit: number, window: number): Promise<[number, number]> {
        const [remaining, reset] = await this._localStorage.getRateLimit(`${key}:${this._localKey}`, limit, window)

        if (!remaining) {
            throw new RateLimitError(reset)
        }

        return [remaining - 1, reset]
    }

    /**
     * Throttle some handler.
     *
     * When the rate limit exceeds, this function waits for it to reset.
     *
     * This is a simple wrapper over {@link rateLimit}, and follows the same logic.
     *
     * > **Note**: `key` is used to prefix the local key
     * > derived using the given key delegate.
     *
     * @param key  Key of the rate limit
     * @param limit  Maximum number of requests in `window`
     * @param window  Window size in seconds
     * @returns  Tuple containing the number of remaining and
     *   unix time in ms when the user can try again
     */
    async throttle(key: string, limit: number, window: number): Promise<[number, number]> {
        try {
            return await this.rateLimit(key, limit, window)
        } catch (e) {
            if (e.constructor === RateLimitError) {
                await sleep(e.reset - Date.now())
                return this.throttle(key, limit, window)
            } else throw e
        }
    }

    /**
     * Reset the rate limit
     *
     * @param key  Key of the rate limit
     */
    async resetRateLimit(key: string): Promise<void> {
        await this._localStorage.resetRateLimit(`${key}:${this._localKey}`)
    }
}
