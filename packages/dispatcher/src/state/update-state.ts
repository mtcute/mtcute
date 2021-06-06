import { IStateStorage } from './storage'

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
    async get(fallback?: State, force?: boolean): Promise<State>
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
     * @param ttl  TTL for the new state
     */
    async set(state: State, ttl?: number): Promise<void> {
        this._cached = state
        await this._localStorage.setState(this._localKey, state, ttl)
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
     * @param ttl  TTL for the scene
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
}
