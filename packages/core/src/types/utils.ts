export type { MaybeArray, MaybePromise } from '@fuman/utils'

export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>
export type PartialOnly<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>
export type AnyToNever<T> = any extends T ? never : T

export type MustEqual<T, V> = (() => T) extends () => V ? ((() => V) extends () => T ? T : V) : V

export type PublicPart<T> = { [K in keyof T]: T[K] }

export function assertNever(_: never): never {
  throw new Error('Illegal state')
}
