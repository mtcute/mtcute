import { CallbackQuery, Message } from '@mtcute/client'
import { MaybeAsync } from '@mtcute/core'

import { UpdateFilter } from './types'

/**
 * Create a filter for the cases when the state is empty
 */
export const stateEmpty: UpdateFilter<Message> = async (upd, state) => {
    if (!state) return false

    return !(await state.get())
}

/**
 * Create a filter based on state predicate
 *
 * If state exists and matches `predicate`, update passes
 * this filter, otherwise it doesn't
 *
 * @param predicate  State predicate
 */
export const state = <T>(
    predicate: (state: T) => MaybeAsync<boolean>,
    // eslint-disable-next-line @typescript-eslint/ban-types
): UpdateFilter<Message | CallbackQuery, {}, T> => {
    return async (upd, state) => {
        if (!state) return false
        const data = await state.get()
        if (!data) return false

        return predicate(data)
    }
}
