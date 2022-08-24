import { MtArgumentError, ParsedUpdate } from '@mtcute/client'
import { I18nValue, MtcuteI18nFunction, OtherLanguageWrap } from './types'
import { createI18nStringsIndex, extractLanguageFromUpdate } from './utils'

export * from './types'

export interface MtcuteI18nParameters<Strings> {
    /**
     * Primary language which will also be used as a fallback
     */
    primaryLanguage: {
        /**
         * Two letter language code.
         */
        name: string

        /**
         * Strings for the language.
         */
        strings: Strings
    }

    otherLanguages?: Record<string, OtherLanguageWrap<Strings>>

    /**
     * Language that will be used if no language is specified
     *
     * Defaults to {@link primaryLanguage}
     */
    defaultLanguage?: string
}

export function createMtcuteI18n<Strings>(
    params: MtcuteI18nParameters<Strings>
): MtcuteI18nFunction<Strings> {
    const {
        primaryLanguage,
        otherLanguages,
        defaultLanguage = primaryLanguage.name,
    } = params

    const indexes: Record<string, Record<string, I18nValue>> = {}
    const fallbackIndex = (indexes[primaryLanguage.name] =
        createI18nStringsIndex(primaryLanguage.strings))
    if (otherLanguages) {
        Object.keys(otherLanguages).forEach((lang) => {
            indexes[lang] = createI18nStringsIndex(otherLanguages[lang])
        })
    }

    if (!(defaultLanguage in indexes)) {
        throw new MtArgumentError(
            'defaultLanguage is not a registered language'
        )
    }

    const tr = (lang: ParsedUpdate['data'] | string | null, key: string, ...params: any[]) => {
        if (lang === null) lang = defaultLanguage

        if (typeof lang === 'object') {
            lang = extractLanguageFromUpdate(lang) ?? defaultLanguage
        }

        const strings = indexes[lang] ?? fallbackIndex

        let val = strings[key] ?? fallbackIndex[key] ?? `[missing: ${key}]`

        if (typeof val === 'function') {
            val = val(...params)
        }

        return val
    }

    return tr as MtcuteI18nFunction<Strings>
}
