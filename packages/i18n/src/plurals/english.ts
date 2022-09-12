import { I18nValue, I18nValueDynamic } from "../types";

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

export function pluralizeEnglish<T>(n: number, one: T, many: T): T {
    return n === 1 ? one : many
}

export function createPluralEnglish<Args extends any[] = []>(
    one: I18nValue<[number, ...Args]>,
    many: I18nValue<[number, ...Args]>
): I18nValueDynamic<[number, ...Args]> {
    if (typeof one === 'function' && typeof many === 'function') {
        return (n, ...args) => (n === 1 ? one(n, ...args) : many(n, ...args))
    }

    if (typeof one === 'string' && typeof many === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (n, ...args) => (n === 1 ? one : many)
    }

    if (typeof one === 'string' && typeof many === 'function') {
        return (n, ...args) => (n === 1 ? one : many(n, ...args))
    }

    if (typeof one === 'function' && typeof many === 'string') {
        return (n, ...args) => (n === 1 ? one(n, ...args) : many)
    }

    throw new TypeError()
}
