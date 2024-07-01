/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument */

import Long from 'long'

import { getPlatform } from '../../platform.js'

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

// get all property names. unlike Object.getOwnPropertyNames,
// also gets inherited property names
function getAllGettersNames<T>(obj: T): (keyof T)[] {
    const getters: (keyof T)[] = []

    do {
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            if (
                prop !== '__proto__' &&
                Object.getOwnPropertyDescriptor(obj, prop)?.get &&
                !getters.includes(prop as any)
            ) {
                getters.push(prop as any)
            }
        })
    } while ((obj = Object.getPrototypeOf(obj)))

    return getters
}

/**
 * Small helper function that adds `toJSON` and `util.custom.inspect`
 * methods to a given class based on its getters
 *
 * > **Note**: This means that all getters must be pure!
 * > (getter that caches after its first invocation is also
 * > considered pure in this case)
 */
export function makeInspectable<T>(
    obj: new (...args: any[]) => T,
    props?: (keyof T)[],
    hide?: (keyof T)[],
): typeof obj {
    return obj
}
