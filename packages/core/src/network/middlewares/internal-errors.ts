import { tl } from '@mtcute/tl'

import { MtTimeoutError } from '../../types/errors.js'
import { combineAbortSignals } from '../../utils/abort-signal.js'
import { sleepWithAbort } from '../../utils/misc-utils.js'
import { isTlRpcError } from '../../utils/type-assertions.js'
import type { RpcCallMiddleware } from '../network-manager.js'

const CLIENT_ERRORS = /* #__PURE__ */ new Set<number>([
    tl.RpcError.BAD_REQUEST,
    tl.RpcError.UNAUTHORIZED,
    tl.RpcError.FORBIDDEN,
    tl.RpcError.NOT_FOUND,
    tl.RpcError.FLOOD,
    tl.RpcError.SEE_OTHER,
    tl.RpcError.NOT_ACCEPTABLE,
])

export interface InternalErrorsHandlerOptions {
    /**
     * Maximum number of retries to perform when an internal server error is encountered.
     *
     * @default  Infinity
     */
    maxRetries?: number

    /**
     * Number of seconds to wait before retrying
     * when an internal server error is encountered.
     *
     * @default 1
     */
    waitTime?: number
}

export function internalErrorsHandler(params: InternalErrorsHandlerOptions): RpcCallMiddleware {
    const { maxRetries = Infinity, waitTime = 1 } = params

    return async (ctx, next) => {
        const numRetries = ctx.params?.maxRetryCount ?? maxRetries

        for (let i = 0; i <= numRetries; i++) {
            const res = await next(ctx)
            if (!isTlRpcError(res)) return res

            if (!CLIENT_ERRORS.has(res.errorCode)) {
                if (ctx.params?.throw503 && res.errorCode === -503) {
                    throw new MtTimeoutError()
                }

                const waitSeconds = res.errorMessage === 'WORKER_BUSY_TOO_LONG_RETRY' ? Math.max(1, waitTime) : waitTime

                ctx.manager._log.warn(
                    'Telegram is having internal issues: %d:%s, retrying in %ds',
                    res.errorCode,
                    res.errorMessage,
                    waitSeconds,
                )

                if (waitSeconds > 0) {
                    await sleepWithAbort(
                        waitSeconds * 1000,
                        combineAbortSignals(ctx.manager.params.stopSignal, ctx.params?.abortSignal),
                    )
                }

                continue
            }

            return res
        }
    }
}
