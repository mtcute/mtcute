import type { I18nValue, I18nValueDynamic } from '../types.js'

/**
 * Get an English ordinal suffix (st/nd/rd/th) for a given number.
 */
export function ordinalSuffixEnglish(n: number): string {
    const v = n % 100
    if (v > 3 && v < 21) return 'th'

    switch (v % 10) {
        case 1:
            return 'st'
        case 2:
            return 'nd'
        case 3:
            return 'rd'
        default:
            return 'th'
    }
}

/**
 * Pluralize a value by English rules
 *
 * @param n  Number of items
 * @param one  Value for "one" (1 item)
 * @param many  Value for "many" (0 items, 2 items, many items)
 */
export function pluralizeEnglish<T>(n: number, one: T, many: T): T {
    return n === 1 ? one : many
}

/**
 * Create a complex English pluralized value
 *
 * @param one  Value for "one" (1 item)
 * @param many  Value for "many" (0 items, 2 items, many items)
 */
export function createPluralEnglish<Args extends unknown[] = []>(
    one: I18nValue<[number, ...Args]>,
    many: I18nValue<[number, ...Args]>,
): I18nValueDynamic<[number, ...Args]> {
    if (typeof one === 'function' && typeof many === 'function') {
        return (n, ...args) => (n === 1 ? one(n, ...args) : many(n, ...args))
    }

    if (typeof one === 'string' && typeof many === 'string') {
        // eslint-disable-next-line unused-imports/no-unused-vars
        return (n, ...args) => (n === 1 ? one : many)
    }

    if (typeof one === 'string' && typeof many === 'function') {
        return (n, ...args) => (n === 1 ? one : many(n, ...args))
    }

    if (typeof one === 'function' && typeof many === 'string') {
        return (n, ...args) => (n === 1 ? one(n, ...args) : many)
    }

    throw new TypeError('Invalid arg types')
}
