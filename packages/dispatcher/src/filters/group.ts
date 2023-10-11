import { Message } from '@mtcute/client'
import { MaybeAsync } from '@mtcute/core'

import { MessageContext } from '../context'
import { Modify, UpdateFilter } from './types'

/**
 * For message groups, apply a filter to every message in the group.
 * Filter will match if **all** messages match.
 *
 * > **Note**: This also applies type modification to every message in the group
 *
 * @param filter
 * @returns
 */
export function every<Mod, State>(
    filter: UpdateFilter<Message, Mod, State>,
): UpdateFilter<
    MessageContext,
    Mod & {
        messages: Modify<MessageContext, Mod>[]
    },
    State
> {
    return (ctx, state) => {
        let i = 0
        const upds = ctx.messages
        const max = upds.length

        const next = (): MaybeAsync<boolean> => {
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
// eslint-disable-next-line
export function some<State>(filter: UpdateFilter<Message, any, State>): UpdateFilter<MessageContext, {}, State> {
    return (ctx, state) => {
        let i = 0
        const upds = ctx.messages
        const max = upds.length

        const next = (): MaybeAsync<boolean> => {
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
