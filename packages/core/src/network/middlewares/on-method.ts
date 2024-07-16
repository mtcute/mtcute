import { tl } from '@mtcute/tl'

import { Middleware } from '../../utils/composer.js'
import { RpcCallMiddleware, RpcCallMiddlewareContext } from '../network-manager.js'

/**
 * Middleware that will call `handler` whenever `method` RPC method is called.
 *
 * This helper exists due to TypeScript limitations not allowing us to
 * properly type the return type without explicit type annotations,
 * for a bit more type-safe and clean code:
 *
 * ```ts
 * // before
 * async (ctx, next) => {
 *   if (rpc.request._ === 'help.getNearestDc') {
 *     return {
 *       _: 'nearestDc',
 *       country: 'RU',
 *       thisDc: 2,
 *       nearestDc: 2,
 *     } satisfies tl.RpcCallReturn['help.getNearestDc']
 *   }
 *
 *   return next(ctx)
 * }
 *
 * // after
 * onMethod('help.getNearestDc', async () => ({
 *   _: 'nearestDc' as const, // (otherwise ts will infer this as `string` and will complain)
 *   country: 'RU',
 *   thisDc: 2,
 *   nearestDc: 2,
 * })
 * ```
 */
export function onMethod<T extends tl.RpcMethod['_']>(
    method: T,
    middleware: Middleware<
        Omit<RpcCallMiddlewareContext, 'request'> & {
            request: Extract<tl.RpcMethod, { _: T }>
        },
        tl.RpcCallReturn[T]
    >,
): RpcCallMiddleware {
    return async (ctx, next) => {
        if (ctx.request._ !== method) {
            return next(ctx)
        }

        // eslint-disable-next-line
        return middleware(ctx as any, next)
    }
}
