import { I18nValue, I18nValueDynamic } from '../types'

/**
 * Pluralize a value by Russian rules
 *
 * @param n  Number of items
 * @param one  Value for "one" (1 стол, 21 стол)
 * @param few  Value for "few" (2 стола, 42 стола)
 * @param many  Value for "many" (5 столов, 100 столов, 0 столов, нет столов)
 */
export function pluralizeRussian<T>(
    n: number,
    one: T,
    few: T,
    many: T,
): T {
    // reference: https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html#ru

    // one: 1 книга
    // few: 2 книги, 3 книги, 4 книги
    // many: 5 книг, 10 книг, 20 книг, 100 книг (also 0 книг, нет книг)

    const mod10 = n % 10
    const mod100 = n % 100

    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few

    return many
}

/**
 * Create a complex Russian pluralized value
 *
 * @param one  Value for "one" (1 стол, 21 стол)
 * @param few  Value for "few" (2 стола, 42 стола)
 * @param many  Value for "many" (5 столов, 100 столов, 0 столов, нет столов)
 */
export function createPluralRussian<Args extends unknown[] = []>(
    one: I18nValue<[number, ...Args]>,
    few: I18nValue<[number, ...Args]>,
    many: I18nValue<[number, ...Args]>,
): I18nValueDynamic<[number, ...Args]> {
    return (n, ...args) => {
        const val = pluralizeRussian(n, one, few, many)
        if (typeof val === 'function') return val(n, ...args)

        return val
    }
}
