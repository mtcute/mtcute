import type { I18nStrings, I18nValue, MtcuteI18nAdapter, MtcuteI18nFunction, OtherLanguageWrap } from './types.js'
import { createI18nStringsIndex, extractLanguageFromUpdate } from './utils.js'

export * from './plurals/english.js'
export * from './plurals/russian.js'
export * from './types.js'
export { extractLanguageFromUpdate } from './utils.js'

export interface MtcuteI18nParameters<Strings extends I18nStrings, Input> {
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
     * @default  {@link primaryLanguage}
     */
    defaultLanguage?: string

    /**
     * Adapter that will be used to extract language from the update.
     */
    adapter?: MtcuteI18nAdapter<Input>
}

export function createMtcuteI18n<Strings extends I18nStrings, Input>(
    params: MtcuteI18nParameters<Strings, Input>,
): MtcuteI18nFunction<Strings, Input> {
    const {
        primaryLanguage,
        otherLanguages,
        defaultLanguage = primaryLanguage.name,
        adapter = extractLanguageFromUpdate as unknown as MtcuteI18nAdapter<Input>,
    } = params

    const indexes: Record<string, Record<string, I18nValue>> = {}
    const fallbackIndex = (indexes[primaryLanguage.name] = createI18nStringsIndex(primaryLanguage.strings))

    if (otherLanguages) {
        Object.keys(otherLanguages).forEach((lang) => {
            indexes[lang] = createI18nStringsIndex(otherLanguages[lang] as I18nStrings)
        })
    }

    if (!(defaultLanguage in indexes)) {
        throw new TypeError('defaultLanguage is not a registered language')
    }

    const tr = (lang: Input | string | null, key: string, ...params: unknown[]) => {
        if (lang === null) lang = defaultLanguage

        if (typeof lang !== 'string') {
            lang = adapter(lang) ?? defaultLanguage
        }

        const strings = indexes[lang] ?? fallbackIndex

        let val = strings[key] ?? fallbackIndex[key] ?? `[missing: ${key}]`

        if (typeof val === 'function') {
            val = val(...params)
        }

        return val
    }

    return tr as MtcuteI18nFunction<Strings, Input>
}
