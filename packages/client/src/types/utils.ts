import { MaybeAsync } from '@mtcute/core'

export type MaybeDynamic<T> = MaybeAsync<T> | (() => MaybeAsync<T>)

export type ArrayWithTotal<T> = T[] & { total: number }
