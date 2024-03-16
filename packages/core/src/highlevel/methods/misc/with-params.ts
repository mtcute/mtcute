import { tl } from '@mtcute/tl'

import { RpcCallOptions } from '../../../network/index.js'
import { ITelegramClient } from '../../client.types.js'

// @skip
/**
 * Wrap a client so that all RPC calls will use the specified parameters.
 *
 * @param client Client to wrap
 * @param params RPC call parameters to use by default
 * @returns The wrapped client
 */
export function withParams<T extends ITelegramClient>(client: T, params: RpcCallOptions): T {
    const wrappedCall = (message: tl.RpcMethod, extraParams?: RpcCallOptions) =>
        client.call(message, extraParams ? { ...params, ...extraParams } : params)

    const proxy: T = new Proxy<T>(client, {
        get: (target, prop, receiver) => {
            if (prop === 'call') {
                return wrappedCall
            }

            if (prop === '_client') {
                // ideally we would wrap it as well, but it's not really needed, since TelegramClient
                // TelegramClient stores underlying client in _client
                // itself implements ITelegramClient
                // very much a hack, but i dont care :D
                return proxy
            }

            return Reflect.get(target, prop, receiver)
        },
    })

    return proxy
}
