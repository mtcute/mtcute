import { MaybeAsync } from '@mtcute/client'

/**
 * Interface for FSM storage for the dispatcher.
 *
 * All of the officially supported storages already implement
 * this interface, so you can just re-use it.
 *
 * Current scene is a special case of a `string` state,
 * Most of the time you can just store it the same way
 * as normal state, prefixing with something like `$current_state_`
 * (scene name can't start with `$`).
 * Alternatively, you can store them as simple strings
 */
export interface IStateStorage {
    /**
     * Retrieve state from the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     */
    getState(key: string): MaybeAsync<unknown>

    /**
     * Save state to the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     * @param state  Object representing the state
     * @param ttl  TTL for the state, in seconds
     */
    setState(key: string, state: unknown, ttl?: number): MaybeAsync<void>

    /**
     * Delete state from the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     */
    deleteState(key: string): MaybeAsync<void>

    /**
     * Retrieve the current scene UID from the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     */
    getCurrentScene(key: string): MaybeAsync<string | null>

    /**
     * Change current scene's UID from the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     * @param scene  New scene
     * @param ttl  TTL for the scene, in seconds
     */
    setCurrentScene(key: string, scene: string, ttl?: number): MaybeAsync<void>

    /**
     * Delete current scene from the storage, effectively "exiting" to root.
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     */
    deleteCurrentScene(key: string): MaybeAsync<void>

    /**
     * Get information about a rate limit.
     *
     * It is recommended that you use sliding window or leaky bucket
     * to implement rate limiting ([learn more](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/)),
     *
     * @param key  Key of the rate limit
     * @param limit  Maximum number of requests in `window`
     * @param window  Window size in seconds
     * @returns  Tuple containing the number of remaining and
     *   unix time in ms when the user can try again
     */
    getRateLimit(key: string, limit: number, window: number): MaybeAsync<[number, number]>

    /**
     * Reset a rate limit.
     *
     * @param key  Key of the rate limit
     */
    resetRateLimit(key: string): MaybeAsync<void>
}
