import { MaybePromise, Message } from '@mtcute/core'

import { BusinessMessageContext } from '../context/business-message.js'
import { MessageContext } from '../context/message.js'
import { Modify, UpdateFilter } from './types.js'

/**
 * For message groups, apply a filter to every message in the group.
 * Filter will match if **all** messages match.
 *
 * > **Note**: This also applies type modification to every message in the group
 *
 * @param filter
 * @returns
 */
export function every<Mod, State extends object>(
    filter: UpdateFilter<Message, Mod, State>,
): UpdateFilter<
    MessageContext | BusinessMessageContext,
    Mod & {
        messages: Modify<MessageContext | BusinessMessageContext, Mod>[]
    },
    State
> {
    return (ctx, state) => {
        let i = 0
        const upds = ctx.messages
        const max = upds.length

        const next = (): MaybePromise<boolean> => {
            if (i === max) return true

            const res = filter(upds[i++], state)

            if (typeof res === 'boolean') {
                if (!res) return false

                return next()
            }

            return res.then((r: boolean) => {
                if (!r) return false

                return next()
            })
        }

        return next()
    }
}

/**
 * For message groups, apply a filter to every message in the group.
 * Filter will match if **any** message matches.
 *
 * > **Note**: This *does not* apply type modification to any message
 *
 * @param filter
 * @returns
 */
export function some<State extends object>(
    // eslint-disable-next-line
    filter: UpdateFilter<Message, any, State>,
    // eslint-disable-next-line
): UpdateFilter<MessageContext | BusinessMessageContext, {}, State> {
    return (ctx, state) => {
        let i = 0
        const upds = ctx.messages
        const max = upds.length

        const next = (): MaybePromise<boolean> => {
            if (i === max) return false

            const res = filter(upds[i++], state)

            if (typeof res === 'boolean') {
                if (res) return true

                return next()
            }

            return res.then((r: boolean) => {
                if (r) return true

                return next()
            })
        }

        return next()
    }
}
