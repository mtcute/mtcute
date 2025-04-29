import type { mtp } from '@mtcute/tl'

import type { RpcCallMiddleware, RpcCallMiddlewareContext } from '../network-manager.js'
import { combineAbortSignals } from '../../utils/abort-signal.js'
import { sleepWithAbort } from '../../utils/misc-utils.js'
import { isTlRpcError } from '../../utils/type-assertions.js'

const SILENTLY_SLEEP_METHODS = /* @__PURE__ */ new Set([
    'upload.getFile',
    'upload.saveFilePart',
    'upload.saveBigFilePart',
    'updates.getDifference',
    'updates.getChannelDifference',
])
const SILENTLY_SLEEP_THRESHOLD = 5

export interface FloodWaiterOptions {
    /**
     * Maximum number of ms to wait when a FLOOD_WAIT_X
     * error is encountered. If the wait time is greater
     * than this value, the request will throw an error instead
     *
     * This can be overwritten on a per-request basis by setting
     * `floodSleepThreshold` in the request parameters
     *
     * @default  10_000
     */
    maxWait?: number

    /**
     * Maximum number of retries to perform when a FLOOD_WAIT_X
     * error is encountered. After this number of retries, the
     * last error will be thrown
     *
     * @default  5
     */
    maxRetries?: number

    /**
     * Whether to store the last flood wait time and delay
     * the consecutive requests accordingly
     *
     * @default  true
     */
    store?: boolean

    /**
     * If the stored wait time is less than this value,
     * the request will not be delayed
     *
     * @default  2_000
     */
    minStoredWait?: number

    /**
     * Function that will be called before we are about to wait for `seconds`
     * seconds before retrying the request.
     *
     * @default  print a warning to the console, except some methods that often result in flood waits
     */
    onBeforeWait?: (ctx: RpcCallMiddlewareContext, seconds: number) => void
}

export function floodWaiter(options: FloodWaiterOptions): RpcCallMiddleware {
    const {
        maxWait = 10_000,
        maxRetries = 5,
        store = true,
        minStoredWait = 2_000,
        onBeforeWait,
    } = options

    const storage = new Map<string, number>()

    return async (ctx, next) => {
        // do not send requests that are in flood wait
        const method = ctx.request._
        const storedWaitUntil = store ? storage.get(method) : undefined
        const floodSleepThreshold = ctx.params?.floodSleepThreshold ?? maxWait

        if (storedWaitUntil !== undefined) {
            const delta = storedWaitUntil - performance.now()

            if (delta <= minStoredWait) {
                // flood waits below 2 seconds are "ignored"
                storage.delete(method)
            } else if (delta <= floodSleepThreshold) {
                await sleepWithAbort(delta, combineAbortSignals(ctx.manager.params.stopSignal, ctx.params?.abortSignal))
                storage.delete(method)
            } else {
                return {
                    _: 'mt_rpc_error',
                    errorCode: 420,
                    errorMessage: `FLOOD_WAIT_${Math.ceil(delta / 1000)}`,
                } satisfies mtp.RawMt_rpc_error
            }
        }

        let lastError: mtp.RawMt_rpc_error | undefined

        for (let i = 0; i <= maxRetries; i++) {
            const res = await next(ctx)

            if (!isTlRpcError(res)) {
                return res
            }

            lastError = res

            const err = res.errorMessage

            if (
                err.startsWith('FLOOD_WAIT_')
                || err.startsWith('SLOWMODE_WAIT_')
                || err.startsWith('FLOOD_TEST_PHONE_WAIT_')
                || err.startsWith('FLOOD_PREMIUM_WAIT_')
            ) {
                let seconds = Number(err.slice(err.lastIndexOf('_') + 1))

                if (Number.isNaN(seconds)) {
                    ctx.manager._log.warn('invalid flood wait error received: %s, ignoring', err)

                    return res
                }

                if (store && !err.startsWith('SLOWMODE_WAIT_')) {
                    // SLOW_MODE_WAIT is per-chat, not per-request
                    storage.set(method, performance.now() + seconds * 1000)
                }

                // In test servers, FLOOD_WAIT_0 has been observed, and sleeping for
                // such a short amount will cause retries very fast leading to issues
                if (seconds === 0) {
                    seconds = 1
                }

                const ms = seconds * 1000

                if (ms <= floodSleepThreshold) {
                    if (onBeforeWait) {
                        onBeforeWait(ctx, seconds)
                    } else if (!(seconds < SILENTLY_SLEEP_THRESHOLD && SILENTLY_SLEEP_METHODS.has(method))) {
                        ctx.manager._log.warn('%s resulted in a flood wait, will retry in %d seconds', method, seconds)
                    }

                    await sleepWithAbort(
                        ms,
                        combineAbortSignals(ctx.manager.params.stopSignal, ctx.params?.abortSignal),
                    )
                    continue
                }
            }

            return res
        }

        return lastError
    }
}
