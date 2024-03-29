/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybePromise } from '@mtcute/core'

import { UpdateFilter } from './types.js'

/**
 * Create a filter for the cases when the state is empty
 */
export const stateEmpty: UpdateFilter<any> = async (upd, state) => {
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
export const state = <T extends object>(
    predicate: (state: T) => MaybePromise<boolean>,
    // eslint-disable-next-line @typescript-eslint/ban-types
): UpdateFilter<any, {}, T> => {
    return async (upd, state) => {
        if (!state) return false
        const data = await state.get()
        if (!data) return false

        return predicate(data)
    }
}
