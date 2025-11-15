import type { tl } from '@mtcute/tl'

import type { RpcCallOptions } from '../../../network/index.js'
import type { ITelegramClient } from '../../client.types.js'

// @skip
/**
 * Wrap a client so that all RPC calls will use the specified parameters.
 *
 * @param client Client to wrap
 * @param params RPC call parameters to use by default
 * @returns The wrapped client
 */
export function withParams<T extends ITelegramClient>(client: T, params: RpcCallOptions): T {
  const wrappedClientsMap = new WeakMap<ITelegramClient, ITelegramClient>()

  function wrapClient(client: ITelegramClient): ITelegramClient {
    const existing = wrappedClientsMap.get(client)
    if (existing) return existing

    const wrappedCall = (message: tl.RpcMethod, extraParams?: RpcCallOptions) =>
      client.call(message, extraParams ? { ...params, ...extraParams } : params)

    const wrapped = new Proxy(client, {
      get: (target, prop, receiver) => {
        if (prop === 'call') return wrappedCall

        // eslint-disable-next-line  ts/no-unsafe-assignment
        const res = Reflect.get(target, prop, receiver)
        if (res && typeof res === 'object' && 'storage' in res && 'call' in res) {
          // assume it's an ITelegramClient
          // eslint-disable-next-line ts/no-unsafe-argument
          return wrapClient(res)
        }

        // eslint-disable-next-line ts/no-unsafe-return
        return res
      },
    })

    wrappedClientsMap.set(client, wrapped)
    return wrapped
  }

  return wrapClient(client) as T
}
