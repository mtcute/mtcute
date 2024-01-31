/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync } from '../../types/utils.js'

export type MaybeDynamic<T> = MaybeAsync<T> | (() => MaybeAsync<T>)

export type ArrayWithTotal<T> = T[] & { total: number }
export type ArrayPaginated<T, Offset> = T[] & { total: number; next?: Offset }

export type ParametersSkip1<T> = T extends (a: any, ...args: infer P) => any ? P : never
export type ParametersSkip2<T> = T extends (a: any, b: any, ...args: infer P) => any ? P : never
export type ParametersSkip3<T> = T extends (a: any, b: any, c: any, ...args: infer P) => any ? P : never
