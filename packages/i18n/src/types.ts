import type { FormattedString } from '@mtcute/client'

type Values<T> = T[keyof T]
type SafeGet<T, K extends string> = T extends Record<K, any> ? T[K] : never

/**
 * Literal translated value, represented by (optionally formatted) string
 */
export type I18nValueLiteral = string | FormattedString<any>
/**
 * Dynamic translated value, represented by a
 * function resolving to a literal one
 */
export type I18nValueDynamic<Args extends any[] = any[]> = (
    ...args: Args
) => I18nValueLiteral

/**
 * Translated value. Can either be actual value or a function resolving to one
 */
export type I18nValue<Args extends any[] = any[]> =
    | I18nValueLiteral
    | I18nValueDynamic<Args>

type NestedKeysDelimited<T> = Values<{
    [key in Extract<keyof T, string>]: T[key] extends I18nValue
        ? key
        : `${key}.${T[key] extends infer R ? NestedKeysDelimited<R> : never}`
}>

type GetValueNested<T, K extends string> = K extends `${infer P}.${infer Q}`
    ? GetValueNested<SafeGet<T, P>, Q>
    : SafeGet<T, K>

type ExtractParameter<Strings, K extends string> = GetValueNested<
    Strings,
    K
> extends (...params: infer R) => I18nValueLiteral
    ? R
    : []

/**
 * Translation "adapter".
 *
 * Used to extract language from `Input` object.
 */
export type MtcuteI18nAdapter<Input> = (obj: Input) => string | null | undefined

/**
 * Translation function.
 */
export type MtcuteI18nFunction<Strings, Input> = <
    K extends NestedKeysDelimited<Strings>
>(
    lang: Input | string | null,
    key: K,
    ...params: ExtractParameter<Strings, K>
) => string | FormattedString<any>

/**
 * Wrapper type for i18n object containing strings for a language
 * other than the primary one. Used to provide type safety.
 */
export type OtherLanguageWrap<Strings> = {
    [key in keyof Strings]?: Strings[key] extends I18nValue
        ? I18nValue
        : Strings[key] extends Record<string, any>
        ? OtherLanguageWrap<Strings[key]>
        : never
}
