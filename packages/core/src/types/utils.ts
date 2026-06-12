export type { MaybeArray, MaybePromise } from '@fuman/utils'

export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>
export type PartialOnly<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>
export type AnyToNever<T> = any extends T ? never : T

export type MustEqual<T, V> = (() => T) extends () => V ? ((() => V) extends () => T ? T : V) : V

export type PublicPart<T> = { [K in keyof T]: T[K] }

type ReplaceValue<X, T, V>
  = X extends T ? T | V
    : X extends readonly T[]
      ? X extends T[] ? (T | V)[] : readonly (T | V)[]
      : X extends object ? ReplaceDeep<X, T, V>
        : X

export type ReplaceDeep<O, T, V> = {
  [K in keyof O]: ReplaceValue<O[K], T, V>
}

export function assertNever(_: never): never {
  throw new Error('Illegal state')
}
