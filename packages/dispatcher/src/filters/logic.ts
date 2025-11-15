import type { MaybePromise } from '@mtcute/core'

import type { ExtractBaseMany, ExtractMod, Invert, UnionToIntersection, UpdateFilter } from './types.js'

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
export function not<Base, Mod, State extends object>(
  fn: UpdateFilter<Base, Mod, State>,
): UpdateFilter<Base, Invert<Base, Mod>, State> {
  return (upd, state) => {
    const res = fn(upd, state)

    if (typeof res === 'boolean') return !res

    return res.then(r => !r)
  }
}

// i couldn't come up with proper types for these 😭
// if you know how to do this better - PRs are welcome!

export function and<Base1, Mod1, State1 extends object, Base2, Mod2, State2 extends object>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
): UpdateFilter<Base1 & Base2, Mod1 & Mod2, State1 | State2>
export function and<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
): UpdateFilter<Base1 & Base2 & Base3, Mod1 & Mod2 & Mod3, State1 | State2 | State3>
export function and<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
): UpdateFilter<Base1 & Base2 & Base3 & Base4, Mod1 & Mod2 & Mod3 & Mod4, State1 | State2 | State3 | State4>
export function and<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
  Base5,
  Mod5,
  State5 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
  fn5: UpdateFilter<Base5, Mod5, State5>,
): UpdateFilter<
    Base1 & Base2 & Base3 & Base4 & Base5,
    Mod1 & Mod2 & Mod3 & Mod4 & Mod5,
    State1 | State2 | State3 | State4 | State5
>
export function and<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
  Base5,
  Mod5,
  State5 extends object,
  Base6,
  Mod6,
  State6 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
  fn5: UpdateFilter<Base5, Mod5, State5>,
  fn6: UpdateFilter<Base6, Mod6, State6>,
): UpdateFilter<
    Base1 & Base2 & Base3 & Base4 & Base5 & Base6,
    Mod1 & Mod2 & Mod3 & Mod4 & Mod5 & Mod6,
    State1 | State2 | State3 | State4 | State5 | State6
>
export function and<Filters extends UpdateFilter<any, any>[]>(
  ...fns: Filters
): UpdateFilter<ExtractBaseMany<Filters>, UnionToIntersection<ExtractMod<Filters[number]>>>

/**
 * Combine multiple filters by applying an AND logical
 * operation between every one of them:
 * `and(fn1, fn2, ..., fnN) = fn1 AND fn2 AND ... AND fnN`
 *
 * > **Note**: This also combines type modifications, i.e.
 * > if the 1st has modification `{ field1: string }`
 * > and the 2nd has modification `{ field2: number }`,
 * > then the combined filter will have
 * > combined modification `{ field1: string, field2: number }`
 *
 * > **Note**: Due to TypeScript limitations (or more likely my lack of brain cells),
 * > state type is only correctly inferred for up to 6 filters.
 * > If you need more, either provide type explicitly (e.g. `filters.state<SomeState>(...)`),
 * > or combine multiple `and` calls.
 *
 * @param fns  Filters to combine
 */
export function and(...fns: UpdateFilter<any, any, any>[]): UpdateFilter<any, any, any> {
  return (upd, state) => {
    let i = 0
    const max = fns.length

    const next = (): MaybePromise<boolean> => {
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

export function or<Base1, Mod1, State1 extends object, Base2, Mod2, State2 extends object>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
): UpdateFilter<Base1 & Base2, Mod1 | Mod2, State1 | State2>

export function or<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
): UpdateFilter<Base1 & Base2 & Base3, Mod1 | Mod2 | Mod3, State1 | State2 | State3>

export function or<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
): UpdateFilter<Base1 & Base2 & Base3 & Base4, Mod1 | Mod2 | Mod3 | Mod4, State1 | State2 | State3 | State4>

export function or<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
  Base5,
  Mod5,
  State5 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
  fn5: UpdateFilter<Base5, Mod5, State5>,
): UpdateFilter<
    Base1 & Base2 & Base3 & Base4 & Base5,
    Mod1 | Mod2 | Mod3 | Mod4 | Mod5,
    State1 | State2 | State3 | State4 | State5
>

export function or<
  Base1,
  Mod1,
  State1 extends object,
  Base2,
  Mod2,
  State2 extends object,
  Base3,
  Mod3,
  State3 extends object,
  Base4,
  Mod4,
  State4 extends object,
  Base5,
  Mod5,
  State5 extends object,
  Base6,
  Mod6,
  State6 extends object,
>(
  fn1: UpdateFilter<Base1, Mod1, State1>,
  fn2: UpdateFilter<Base2, Mod2, State2>,
  fn3: UpdateFilter<Base3, Mod3, State3>,
  fn4: UpdateFilter<Base4, Mod4, State4>,
  fn5: UpdateFilter<Base5, Mod5, State5>,
  fn6: UpdateFilter<Base6, Mod6, State6>,
): UpdateFilter<
    Base1 & Base2 & Base3 & Base4 & Base5 & Base6,
    Mod1 | Mod2 | Mod3 | Mod4 | Mod5 | Mod6,
    State1 | State2 | State3 | State4 | State5 | State6
>

/**
 * Combine multiple filters by applying an OR logical
 * operation between every one of them:
 * `or(fn1, fn2, ..., fnN) = fn1 OR fn2 OR ... OR fnN`
 *
 * > **Note**: This also combines type modifications in a union, i.e.
 * > if the 1st has modification `{ field1: string }`
 * > and the 2nd has modification `{ field2: number }`,
 * > then the combined filter will have
 * > modification `{ field1: string } | { field2: number }`.
 *
 * > **Note**: Due to TypeScript limitations (or more likely my lack of brain cells),
 * > state type is only correctly inferred for up to 6 filters.
 * > If you need more, either provide type explicitly (e.g. `filters.state<SomeState>(...)`),
 * > or combine multiple `and` calls.
 *
 * @param fns  Filters to combine
 */
export function or(...fns: UpdateFilter<any, any, any>[]): UpdateFilter<any, any, any> {
  return (upd, state) => {
    let i = 0
    const max = fns.length

    const next = (): MaybePromise<boolean> => {
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
