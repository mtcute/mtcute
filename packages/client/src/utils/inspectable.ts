/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument */

import { createRequire } from 'module'

import { base64Encode } from './index.js'

let util: typeof import('util') | null = null

try {
    // @only-if-esm
    const require = createRequire(import.meta.url)
    // @/only-if-esm
    util = require('util') as typeof import('util')
} catch (e) {}

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

const bufferToJsonInspect = function (this: Uint8Array) {
    return base64Encode(this)
}

/**
 * Small helper function that adds `toJSON` and `util.custom.inspect`
 * methods to a given class based on its getters
 *
 * > **Note**: This means that all getters must be pure!
 * > (getter that caches after its first invocation is also
 * > considered pure in this case)
 */
export function makeInspectable<T>(obj: new (...args: any[]) => T, props?: (keyof T)[], hide?: (keyof T)[]): void {
    const getters: (keyof T)[] = props ? props : []

    for (const key of getAllGettersNames<T>(obj.prototype)) {
        if (!hide || !hide.includes(key)) getters.push(key)
    }

    // dirty hack to set name for inspect result
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const proto = new Function(`return function ${obj.name}(){}`)().prototype

    obj.prototype.toJSON = function (nested = false) {
        if (!nested) {
            (Uint8Array as any).toJSON = bufferToJsonInspect
        }

        const ret: any = Object.create(proto)
        getters.forEach((it) => {
            try {
                let val = this[it]

                if (val && typeof val === 'object' && typeof val.toJSON === 'function') {
                    val = val.toJSON(true)
                }
                ret[it] = val
            } catch (e: any) {
                ret[it] = 'Error: ' + e.message
            }
        })

        if (!nested) {
            delete (Uint8Array as any).prototype.toJSON
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return ret
    }
    if (util) {
        obj.prototype[util.inspect.custom] = obj.prototype.toJSON
    }
}
