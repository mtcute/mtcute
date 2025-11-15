import type { tl } from '@mtcute/tl'

import type { RpcCallOptions } from '../../../network/network-manager.js'
import type { MustEqual } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'

/**
 * Account takeout session
 */
export class TakeoutSession {
  /**
   * Takeout session id
   */
  readonly id: tl.Long

  constructor(
    readonly client: ITelegramClient,
    session: tl.account.RawTakeout,
  ) {
    this.id = session.id
  }

  /**
   * Make an API call using this takeout session
   *
   * This method just wraps the query into `invokeWithTakeout`
   * and passes the control down to {@link TelegramClient.call}.
   *
   * @param message  RPC method to call
   * @param params  Additional call parameters
   */
  async call<T extends tl.RpcMethod>(
    message: MustEqual<T, tl.RpcMethod>,
    params?: RpcCallOptions & {
      /** If passed, the request will be wrapped in an `invokeWithMessagesRange` */
      withMessageRange?: tl.TypeMessageRange
    },
  ): Promise<tl.RpcCallReturn[T['_']]> {
    let query: tl.RpcMethod = {
      _: 'invokeWithTakeout',
      takeoutId: this.id,
      query: message,
    }
    if (params?.withMessageRange) {
      query = {
        _: 'invokeWithMessagesRange',
        range: params.withMessageRange,
        query,
      }
    }

    // eslint-disable-next-line ts/no-unsafe-return
    return this.client.call(query, params)
  }

  /**
   * Create a proxy over {@link TelegramClient}
   * that will use this takeout session to call methods.
   *
   * You can optionally provide a function to check if some
   * RPC method should be called via a takeout session or directly,
   * otherwise all methods are called through the takeout session.
   */
  createProxy(params?: RpcCallOptions & {
    /**
     * Function that given the RPC call should determine whether
     * that call should be called via takeout session (and use the rest of the params passed here) or not.
     * Returning `true` will use takeout session, `false` will call the method directly.
     *
     * @default  `undefined`, i.e. all calls are sent via takeout session
     */
    predicate?: (obj: tl.TlObject) => boolean

    /** If passed, the request will be wrapped in an `invokeWithMessagesRange` */
    withMessageRange?: tl.TypeMessageRange
  }): ITelegramClient {
    const boundCall: TakeoutSession['call'] = params
      ? (obj, theirParams) => {
          const mergedParams = theirParams ? { ...params, ...theirParams } : params
          if (!params.predicate || params.predicate?.(obj)) {
            return this.call(obj, mergedParams)
          }

          return this.client.call(obj, params)
        }
      : this.call.bind(this)

    return new Proxy(this.client, {
      get(target, prop, receiver) {
        if (prop === 'call') return boundCall

        // eslint-disable-next-line ts/no-unsafe-return
        return Reflect.get(target, prop, receiver)
      },
    })
  }

  /**
   * Finish account takeout session
   *
   * @param success  Whether the data was successfully exported
   */
  async finish(success = true): Promise<void> {
    const r = await this.call({
      _: 'account.finishTakeoutSession',
      success,
    })

    assertTrue('account.finishTakeoutSession', r)
  }
}

makeInspectable(TakeoutSession)
