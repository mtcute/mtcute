/**
 * Declares a strategy to handle reconnection.
 * When a number is returned, that number of MS will be waited before trying to reconnect.
 * When `false` is returned, connection is not reconnected
 */
export type ReconnectionStrategy<T> = (
    params: T,
    lastError: Error | null,
    consequentFails: number,
    previousWait: number | null,
) => number | false

/**
 * default reconnection strategy: first - immediate reconnection,
 * then 1s with linear increase up to 5s (with 1s step)
 */
export const defaultReconnectionStrategy: ReconnectionStrategy<object> = (
    params,
    lastError,
    consequentFails,
    previousWait,
) => {
    if (previousWait === null) return 0
    if (previousWait === 0) return 1000
    if (previousWait >= 5000) return 5000

    return Math.min(5000, previousWait + 1000)
}
