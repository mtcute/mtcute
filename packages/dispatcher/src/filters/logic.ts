/* eslint-disable @typescript-eslint/no-explicit-any */
// ^^ will be looked into in MTQ-29

import { MaybeAsync } from '@mtcute/core'

import { UpdateState } from '../state'
import { ExtractBaseMany, ExtractMod, ExtractState, Invert, UnionToIntersection, UpdateFilter } from './types'

/**
 * Filter that matches any update
 */
export const any: UpdateFilter<any> = () => true

/**
 * Invert a filter by applying a NOT logical operation:
 * `not(fn) = NOT fn`
 *
 * > **Note**: This also inverts type modification, i.e.
 * > if the base is `{ field: string | number | null }`
 * > and the modification is `{ field: string }`,
 * > then the negated filter will have
 * > inverted modification `{ field: number | null }`
 *
 * @param fn  Filter to negate
 */
export function not<Base, Mod, State>(
    fn: UpdateFilter<Base, Mod, State>,
): UpdateFilter<Base, Invert<Base, Mod>, State> {
    return (upd, state) => {
        const res = fn(upd, state)

        if (typeof res === 'boolean') return !res

        return res.then((r) => !r)
    }
}

/**
 * Combine two filters by applying an AND logical operation:
 * `and(fn1, fn2) = fn1 AND fn2`
 *
 * > **Note**: This also combines type modifications, i.e.
 * > if the 1st has modification `{ field1: string }`
 * > and the 2nd has modification `{ field2: number }`,
 * > then the combined filter will have
 * > combined modification `{ field1: string, field2: number }`
 *
 * @param fn1  First filter
 * @param fn2  Second filter
 */
export function and<Base, Mod1, Mod2, State1, State2>(
    fn1: UpdateFilter<Base, Mod1, State1>,
    fn2: UpdateFilter<Base, Mod2, State2>,
): UpdateFilter<Base, Mod1 & Mod2, State1 | State2> {
    return (upd, state) => {
        const res1 = fn1(upd, state as UpdateState<State1>)

        if (typeof res1 === 'boolean') {
            if (!res1) return false

            return fn2(upd, state as UpdateState<State2>)
        }

        return res1.then((r1) => {
            if (!r1) return false

            return fn2(upd, state as UpdateState<State2>)
        })
    }
}

/**
 * Combine two filters by applying an OR logical operation:
 * `or(fn1, fn2) = fn1 OR fn2`
 *
 * > **Note**: This also combines type modifications in a union, i.e.
 * > if the 1st has modification `{ field1: string }`
 * > and the 2nd has modification `{ field2: number }`,
 * > then the combined filter will have
 * > modification `{ field1: string } | { field2: number }`.
 * >
 * > It is up to the compiler to handle `if`s inside
 * > the handler function code, but this works with other
 * > logical functions as expected.
 *
 * @param fn1  First filter
 * @param fn2  Second filter
 */
export function or<Base, Mod1, Mod2, State1, State2>(
    fn1: UpdateFilter<Base, Mod1, State1>,
    fn2: UpdateFilter<Base, Mod2, State2>,
): UpdateFilter<Base, Mod1 | Mod2, State1 | State2> {
    return (upd, state) => {
        const res1 = fn1(upd, state as UpdateState<State1>)

        if (typeof res1 === 'boolean') {
            if (res1) return true

            return fn2(upd, state as UpdateState<State2>)
        }

        return res1.then((r1) => {
            if (r1) return true

            return fn2(upd, state as UpdateState<State2>)
        })
    }
}

// im pretty sure it can be done simpler (return types of some and every),
// so if you know how - PRs are welcome!

/**
 * Combine multiple filters by applying an AND logical
 * operation between every one of them:
 * `every(fn1, fn2, ..., fnN) = fn1 AND fn2 AND ... AND fnN`
 *
 * > **Note**: This also combines type modification in a way
 * > similar to {@link and}.
 * >
 * > This method is less efficient than {@link and}
 *
 * > **Note**: This method *currently* does not propagate state
 * > type. This might be fixed in the future, but for now either
 * > use {@link and} or add type manually.
 *
 * @param fns  Filters to combine
 */
export function every<Filters extends UpdateFilter<any, any>[]>(
    ...fns: Filters
): UpdateFilter<ExtractBaseMany<Filters>, UnionToIntersection<ExtractMod<Filters[number]>>> {
    if (fns.length === 2) return and(fns[0], fns[1])

    return (upd, state) => {
        let i = 0
        const max = fns.length

        const next = (): MaybeAsync<boolean> => {
            if (i === max) return true

            const res = fns[i++](upd, state)

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
 * Combine multiple filters by applying an OR logical
 * operation between every one of them:
 * `every(fn1, fn2, ..., fnN) = fn1 OR fn2 OR ... OR fnN`
 *
 * > **Note**: This also combines type modification in a way
 * > similar to {@link or}.
 * >
 * > This method is less efficient than {@link or}
 *
 * > **Note**: This method *currently* does not propagate state
 * > type. This might be fixed in the future, but for now either
 * > use {@link or} or add type manually.
 *
 * @param fns  Filters to combine
 */
export function some<Filters extends UpdateFilter<any, any, any>[]>(
    ...fns: Filters
): UpdateFilter<ExtractBaseMany<Filters>, ExtractMod<Filters[number]>, ExtractState<Filters[number]>> {
    if (fns.length === 2) return or(fns[0], fns[1])

    return (upd, state) => {
        let i = 0
        const max = fns.length

        const next = (): MaybeAsync<boolean> => {
            if (i === max) return false

            const res = fns[i++](upd, state)

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
