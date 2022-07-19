import { FormattedString, ParsedUpdate } from '@mtcute/client'

type Values<T> = T[keyof T]
type SafeGet<T, K extends string> = T extends Record<K, any> ? T[K] : never

export type I18nValue =
    | string
    | FormattedString<any>
    | ((...args: any[]) => string | FormattedString<any>)

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
> extends (...params: infer R) => any
    ? R
    : never

export type MtcuteI18nFunction<Strings> = <
    K extends NestedKeysDelimited<Strings>
>(
    lang: ParsedUpdate['data'] | string | null,
    key: K,
    ...params: ExtractParameter<Strings, K>
) => string | FormattedString<any>

export type OtherLanguageWrap<Strings> = {
    [key in keyof Strings]?: Strings[key] extends I18nValue
        ? I18nValue
        : Strings[key] extends Record<string, any>
        ? OtherLanguageWrap<Strings[key]>
        : never
}
