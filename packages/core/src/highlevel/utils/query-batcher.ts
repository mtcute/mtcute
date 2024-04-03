import { Deque } from '../../utils/deque.js'
import { ITelegramClient } from '../client.types.js'

type Resolve<T> = (value: T | PromiseLike<T>) => void
type Reject = (err?: unknown) => void

type WaitersMap<K, U, T> = Map<K, [T, Resolve<U | null>, Reject][]>
interface InternalState<K, U, T> {
    waiters: WaitersMap<K, U, T>
    fetchingKeys: Set<K>
    retryQueue: Deque<T>
    numRunning: number
}

// todo: should it be MtClient?

/**
 * Helper function for building batched queries.
 *
 * Concepts:
 *   - "input" - items being passed to the query function
 *   - "output" - items returned by the query function
 *   - "key" - unique identifier of the item, which should be deriveable from both input and output.
 *     used for matching input and output items and deduplicating them.
 */
export function batchedQuery<T, U, K extends string | number>(params: {
    /**
     * Fetcher function, taking an array of input items and returning an array of output items.
     *
     * If some item is not found, it should be omitted from the result array,
     * this way the corresponding request will be resolved with `null`.
     */
    fetch: (client: ITelegramClient, items: T[]) => Promise<U[]>

    /** Key derivation function for input items */
    inputKey: (item: T, client: ITelegramClient) => K
    /** Key derivation function for output items */
    outputKey: (item: U, client: ITelegramClient) => K

    /**
     * Maximum number of items to be passed to the `fetcher` function at once.
     *
     * It is recommended to pass ~half of the maximum allowed by the server,
     * since in some cases failing on a single item will cause the whole batch to fail.
     *
     * @default  Infinity
     */
    maxBatchSize?: number

    /**
     * Maximum number of concurrently running queries.
     *
     * @default  1
     */
    maxConcurrent?: number

    /**
     * In case of an error, we can try retrying the query for some items one-by-one,
     * to avoid failing the whole batch.
     *
     * @param items  Items contained in the batch that failed
     * @param err  Error that was thrown by the fetcher
     * @returns  `true` if the query should be retried for all items, `false` if it should be retried for none,
     *   or an array of items for which the query should be retried (waiters for other items will throw `err`).
     */
    retrySingleOnError?: (items: T[], err: unknown) => boolean | T[]
}): (client: ITelegramClient, item: T) => Promise<U | null> {
    const { inputKey, outputKey, fetch, maxBatchSize = Infinity, maxConcurrent = 1, retrySingleOnError } = params

    const symbol = Symbol('batchedQueryState')

    function getState(client_: ITelegramClient) {
        const client = client_ as { [symbol]?: InternalState<K, U, T> }

        if (!client[symbol]) {
            client[symbol] = {
                waiters: new Map(),
                fetchingKeys: new Set(),
                retryQueue: new Deque(),
                numRunning: 0,
            }
        }

        return client[symbol]
    }

    function addWaiter(client: ITelegramClient, waiters: WaitersMap<K, U, T>, item: T) {
        const key = inputKey(item, client)

        let arr = waiters.get(key)

        if (!arr) {
            arr = []
            waiters.set(key, arr)
        }

        return new Promise<U | null>((resolve, reject) => {
            arr.push([item, resolve, reject])
        })
    }

    function popWaiters(waiters: WaitersMap<K, U, T>, key: K) {
        const arr = waiters.get(key)
        if (!arr) return []

        waiters.delete(key)

        return arr
    }

    function startLoops(client: ITelegramClient, state: InternalState<K, U, T>) {
        for (let i = state.numRunning; i <= maxConcurrent; i++) {
            processPending(client, state)
        }
    }

    function processPending(client: ITelegramClient, state: InternalState<K, U, T>) {
        const { waiters, fetchingKeys, retryQueue } = state

        if (state.numRunning >= maxConcurrent) return

        const request: T[] = []
        const requestKeys: K[] = []
        let isRetryRequest = false

        if (retryQueue.length > 0) {
            // handle retries in the same loop so we can easily use the same concurrency pool
            isRetryRequest = true

            const it = retryQueue.popFront()!
            request.push(it)

            const key = inputKey(it, client)
            requestKeys.push(key)
            fetchingKeys.add(key)
        } else {
            for (const it of waiters.keys()) {
                if (fetchingKeys.has(it)) continue

                request.push(waiters.get(it)![0][0])
                requestKeys.push(it)
                fetchingKeys.add(it)

                if (request.length === maxBatchSize) break
            }

            if (request.length === 0) return
        }

        state.numRunning += 1

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetch(client, request)
            .then((res) => {
                const receivedKeys = new Set<K>()

                for (const it of res) {
                    const key = outputKey(it, client)
                    receivedKeys.add(key)

                    for (const waiter of popWaiters(waiters, key)) {
                        waiter[1](it)
                    }

                    fetchingKeys.delete(key)
                }

                for (const key of requestKeys) {
                    if (!receivedKeys.has(key)) {
                        for (const waiter of popWaiters(waiters, key)) {
                            waiter[1](null)
                        }

                        fetchingKeys.delete(key)
                    }
                }
            })
            .catch((err: unknown) => {
                if (retrySingleOnError && !isRetryRequest) {
                    const retry = retrySingleOnError(request, err)

                    if (retry === true) {
                        for (const it of request) {
                            retryQueue.pushBack(it)
                        }

                        return
                    } else if (Array.isArray(retry)) {
                        for (const req of retry) {
                            const requestKeysIdx = request.indexOf(req)
                            if (requestKeysIdx < 0) continue

                            retryQueue.pushBack(req)
                            // to avoid rejecting it below
                            request.splice(requestKeysIdx, 1)
                            requestKeys.splice(requestKeysIdx, 1)
                        }
                    }
                }

                for (const key of requestKeys) {
                    for (const waiter of popWaiters(waiters, key)) {
                        waiter[2](err)
                    }

                    fetchingKeys.delete(key)
                }
            })
            .then(() => {
                state.numRunning -= 1

                if (waiters.size > 0) processPending(client, state)
            })
    }

    return function (client, item) {
        const state = getState(client)
        const promise = addWaiter(client, state.waiters, item)

        startLoops(client, state)

        return promise
    }
}
