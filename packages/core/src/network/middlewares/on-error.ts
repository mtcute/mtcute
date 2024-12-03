import type { mtp } from '@mtcute/tl'

import type { MaybePromise } from '../../types/utils.js'
import type { RpcCallMiddleware, RpcCallMiddlewareContext } from '../network-manager.js'
import { isTlRpcError } from '../../utils/type-assertions.js'

/**
 * Middleware that will call `handler` whenever an RPC error happens,
 * with the error object itself.
 *
 * The handler can either return nothing
 * (in which case the original error will be thrown), a new error
 * (via the `_: 'mt_rpc_error'` object), or any other value, which
 * will be returned as the result of the RPC call.
 *
 * Note that the return value is **not type-checked**
 * due to limitations of TypeScript. You'll probably want to use `satisfies`
 * keyword to ensure the return value is correct, for example:
 *
 * ```ts
 * networkMiddlewares.onRpcError(async (ctx, error) => {
 *   if (rpc.request._ === 'help.getNearestDc') {
 *     return {
 *       _: 'nearestDc',
 *       country: 'RU',
 *       thisDc: 2,
 *       nearestDc: 2,
 *     } satisfies tl.RpcCallReturn['help.getNearestDc']
 *   }
 * })
 * ```
 */
export function onRpcError(
    handler: (ctx: RpcCallMiddlewareContext, error: mtp.RawMt_rpc_error) => MaybePromise<unknown>,
): RpcCallMiddleware {
    return async (ctx, next) => {
        let res = await next(ctx)

        if (isTlRpcError(res)) {
            const handlerRes = await handler(ctx, res)

            if (handlerRes !== undefined) {
                res = handlerRes
            }
        }

        return res
    }
}
