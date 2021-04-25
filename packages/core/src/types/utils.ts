export type MaybeAsync<T> = T | Promise<T>
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> &
    Pick<T, K>
export type PartialOnly<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>

export type MaybeArray<T> = T | T[]
