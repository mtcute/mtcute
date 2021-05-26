import { MaybeAsync } from '@mtcute/core'

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
    getState(key: string): MaybeAsync<any | null>

    /**
     * Save state to the storage
     *
     * @param key  Key of the state, as defined by {@link StateKeyDelegate}
     * @param state  Object representing the state
     * @param ttl  TTL for the state, in seconds
     */
    setState(key: string, state: any, ttl?: number): MaybeAsync<void>

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
}
