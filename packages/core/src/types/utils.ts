export type MaybePromise<T> = T | Promise<T>
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>
export type PartialOnly<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>

export type MaybeArray<T> = T | T[]

export type MustEqual<T, V> = T extends V ? (V extends T ? T : V) : V

export type PublicPart<T> = { [K in keyof T]: T[K] }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever(x: never): never {
    throw new Error('Illegal state')
}
