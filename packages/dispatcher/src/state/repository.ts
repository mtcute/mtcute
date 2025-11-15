import type { MaybePromise } from '@mtcute/core'

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
export interface IStateRepository {
  /**
   * Retrieve state from the storage
   * If state is not found or has expired, return `null`
   *
   * @param key  Key of the state, as defined by {@link StateKeyDelegate}
   */
  getState: (key: string, now: number) => MaybePromise<string | null>

  /**
   * Save state to the storage
   *
   * @param key  Key of the state, as defined by {@link StateKeyDelegate}
   * @param state  String representing the state
   * @param ttl  TTL for the state, in seconds
   */
  setState: (key: string, state: string, ttl?: number) => MaybePromise<void>

  /**
   * Delete state from the storage
   *
   * @param key  Key of the state, as defined by {@link StateKeyDelegate}
   */
  deleteState: (key: string) => MaybePromise<void>

  /**
   * Clean up expired states and rate limits.
   *
   * @param now  Current unix time in ms
   */
  vacuum: (now: number) => MaybePromise<void>

  /**
   * Get information about a rate limit.
   *
   * It is recommended that you use sliding window or leaky bucket
   * to implement rate limiting ([learn more](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/)),
   *
   * @param key  Key of the rate limit
   * @param now  Current unix time in ms
   * @param limit  Maximum number of requests in `window`
   * @param window  Window size in seconds
   * @returns  Tuple containing the number of remaining and
   *   unix time in ms when the user can try again
   */
  getRateLimit: (key: string, now: number, limit: number, window: number) => MaybePromise<[number, number]>

  /**
   * Reset a rate limit.
   *
   * @param key  Key of the rate limit
   */
  resetRateLimit: (key: string) => MaybePromise<void>
}
