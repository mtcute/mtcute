import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

/**
 * Account takeout session
 */
export class TakeoutSession {
    /**
     * Takeout session id
     */
    readonly id: tl.Long

    constructor(
        readonly client: TelegramClient,
        session: tl.account.RawTakeout
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
        message: T,
        params?: {
            throwFlood: boolean
        }
    ): Promise<tl.RpcCallReturn[T['_']]> {
        return this.client.call(
            {
                _: 'invokeWithTakeout',
                takeoutId: this.id,
                query: message,
            },
            params
        )
    }

    /**
     * Create a proxy over {@link TelegramClient}
     * that will use this takeout session to call methods.
     *
     * You can optionally provide a function to check if some
     * RPC method should be called via a takeout session or directly,
     * otherwise all methods are called through the takeout session.
     *
     * > **Note**: This will return a `Proxy` object that
     * > overrides `call` method. Using this method requires
     * > that your target environment supports `Proxy` and `Reflect` APIs
     *
     * @param predicate
     *     Function that given the RPC call should determine whether
     *     that call should be called via takeout session or not.
     *     Returning `true` will use takeout session, `false` will not.
     */
    createProxy(predicate?: (obj: tl.TlObject) => boolean): TelegramClient {
        const boundCall: TakeoutSession['call'] = predicate
            ? (obj, params) => {
                  if (predicate(obj)) {
                      return this.call(obj, params)
                  }
                  return this.client.call(obj, params)
              }
            : this.call.bind(this)

        return new Proxy(this.client, {
            get(target, prop, receiver) {
                if (prop === 'call') return boundCall
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
        await this.call({
            _: 'account.finishTakeoutSession',
            success,
        })
    }
}

makeInspectable(TakeoutSession)
