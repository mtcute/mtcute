import { mtp, tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../types/errors.js'

// mostly taken from https://github.com/robertmassaioli/ts-is-present

export function isPresent<T>(t: T | undefined | null | void): t is T {
    return t !== undefined && t !== null
}

/**
 * Returns a function that can be used to filter down objects
 * to the ones that have a defined non-null value under the key `k`.
 *
 * @example
 * ```ts
 * const filesWithUrl = files.filter(file => file.url);
 * files[0].url // In this case, TS might still treat this as undefined/null
 *
 * const filesWithUrl = files.filter(hasPresentKey("url"));
 * files[0].url // TS will know that this is present
 * ```
 */
export function hasPresentKey<K extends string | number | symbol>(k: K) {
    return function <T, V> (a: T & { [k in K]?: V | null }): a is T & { [k in K]: V } {
        return a[k] !== undefined && a[k] !== null
    }
}

/**
 * Returns a function that can be used to filter down objects
 * to the ones that have a specific value V under a key `k`.
 *
 * @example
 * ```ts
 * type File = { type: "image", imageUrl: string } | { type: "pdf", pdfUrl: string };
 * const files: File[] = [];
 *
 * const imageFiles = files.filter(file => file.type === "image");
 * files[0].type // In this case, TS will still treat it  as `"image" | "pdf"`
 *
 * const filesWithUrl = files.filter(hasValueKey("type", "image" as const));
 * files[0].type // TS will now know that this is "image"
 * files[0].imageUrl // TS will know this is present, because already it excluded the other union members.
 * ```
 */
export function hasValueAtKey<const K extends string | number | symbol, const V>(k: K, v: V) {
    return function <T> (a: T & { [k in K]: unknown }): a is T & { [k in K]: V } {
        return a[k] === v
    }
}

export function assertTypeIs<T extends tl.TlObject, K extends T['_']>(
    context: string,
    obj: T,
    expected: K,
): asserts obj is tl.FindByName<T, K> {
    if (obj._ !== expected) {
        throw new MtTypeAssertionError(context, expected, obj._)
    }
}

export function assertTypeIsNot<T extends tl.TlObject, K extends T['_']>(
    context: string,
    obj: T,
    expectedNot: K,
): asserts obj is Exclude<T, tl.FindByName<T, K>> {
    if (obj._ === expectedNot) {
        throw new MtTypeAssertionError(context, 'not ' + expectedNot, obj._)
    }
}

export function mtpAssertTypeIs<T extends mtp.TlObject, K extends T['_']>(
    context: string,
    obj: T,
    expected: K,
): asserts obj is mtp.FindByName<T, K> {
    if (obj._ !== expected) {
        throw new MtTypeAssertionError(context, expected, obj._)
    }
}

export function assertTrue(context: string, cond: boolean): asserts cond {
    if (!cond) {
        throw new MtTypeAssertionError(context, 'true', 'false')
    }
}
