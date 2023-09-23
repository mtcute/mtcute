/* eslint-disable @typescript-eslint/no-explicit-any */
// ^^ will be looked into in MTQ-29

import { MaybeAsync } from '@mtcute/core'

import { UpdateState } from '../state'
/**
 * Type describing a primitive filter, which is a function taking some `Base`
 * and a {@link TelegramClient}, checking it against some condition
 * and returning a boolean.
 *
 * If `true` is returned, the filter is considered
 * to be matched, and the appropriate update handler function is called,
 * otherwise next registered handler is checked.
 *
 * Additionally, filter might contain a type modification
 * to `Base` for better code insights. If it is present,
 * it is used to overwrite types (!) of some of the `Base` fields
 * to given (note that this is entirely compile-time! object is not modified)
 *
 * For parametrized filters (like {@link filters.regex}),
 * type modification can also be used to add additional fields
 * (in case of `regex`, its match array is added to `.match`)
 *
 * Example without type mod:
 * ```typescript
 *
 * const hasPhoto: UpdateFilter<Message> = msg => msg.media?.type === 'photo'
 *
 * // ..later..
 * tg.onNewMessage(hasPhoto, async (msg) => {
 *     // `hasPhoto` filter matched, so we can safely assume
 *     // that `msg.media` is a Photo.
 *     //
 *     // but it is very redundant, verbose and error-rome,
 *     // wonder if we could make typescript do this automagically and safely...
 *     await (msg.media as Photo).downloadToFile(`${msg.id}.jpg`)
 * })
 * ```
 *
 * Example with type mod:
 * ```typescript
 *
 * const hasPhoto: UpdateFilter<Message, { media: Photo }> = msg => msg.media?.type === 'photo'
 *
 * // ..later..
 * tg.onNewMessage(hasPhoto, async (msg) => {
 *     // since `hasPhoto` filter matched,
 *     // we have applied the modification to `msg`,
 *     // and `msg.media` now has type `Photo`
 *     //
 *     // no more redundancy and type casts!
 *     await msg.media.downloadToFile(`${msg.id}.jpg`)
 * })
 * ```
 *
 * > **Note**: Type modification can contain anything, even totally unrelated types
 * > and it is *your* task to keep track that everything is correct.
 * >
 * > Bad example:
 * > ```typescript
 * > // we check for `Photo`, but type contains `Audio`. this will be a problem!
 * > const hasPhoto: UpdateFilter<Message, { media: Audio }> = msg => msg.media?.type === 'photo'
 * >
 * > // ..later..
 * > tg.onNewMessage(hasPhoto, async (msg) => {
 * >     // oops! `msg.media` is `Audio` and does not have `.width`!
 * >     console.log(msg.media.width)
 * > })
 * > ```
 *
 * > **Warning!** Do not use the generics provided in functions
 * > like `and`, `or`, etc. Those are meant to be inferred by the compiler!
 */
// we need the second parameter because it carries meta information
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
export type UpdateFilter<Base, Mod = {}, State = never> = (
    update: Base,
    state?: UpdateState<State>,
) => MaybeAsync<boolean>

export type Modify<Base, Mod> = Omit<Base, keyof Mod> & Mod
export type Invert<Base, Mod> = {
    [P in keyof Mod & keyof Base]: Exclude<Base[P], Mod[P]>
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export type ExtractBase<Filter> = Filter extends UpdateFilter<infer I, any> ? I : never

export type ExtractMod<Filter> = Filter extends UpdateFilter<any, infer I> ? I : never

export type ExtractState<Filter> = Filter extends UpdateFilter<any, any, infer I> ? I : never

export type TupleKeys<T extends any[]> = Exclude<keyof T, keyof []>
export type WrapBase<T extends any[]> = {
    [K in TupleKeys<T>]: { base: ExtractBase<T[K]> }
}
export type Values<T> = T[keyof T]
export type UnwrapBase<T> = T extends { base: any } ? T['base'] : never
export type ExtractBaseMany<Filters extends any[]> = UnwrapBase<UnionToIntersection<Values<WrapBase<Filters>>>>
