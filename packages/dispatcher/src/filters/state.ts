import type { MaybePromise } from '@mtcute/core'

import type { UpdateFilter } from './types.js'

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
// eslint-disable-next-line ts/no-empty-object-type
export function state<T extends object>(predicate: (state: T) => MaybePromise<boolean>): UpdateFilter<any, {}, T> {
  return async (upd, state) => {
    if (!state) return false
    const data = await state.get()
    if (!data) return false

    return predicate(data)
  }
}
