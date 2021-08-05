import { MaybeAsync } from '@mtcute/core'

export type MaybeDynamic<T> = MaybeAsync<T> | (() => MaybeAsync<T>)

export type ArrayWithTotal<T> = T[] & { total: number }

let util: any | null = null
try {
    util = require('util')
} catch (e) {}

// get all property names. unlike Object.getOwnPropertyNames,
// also gets inherited property names
function getAllGettersNames(obj: object): string[] {
    const getters: string[] = []

    do {
        Object.getOwnPropertyNames(obj).forEach((prop) => {
            if (
                prop !== '__proto__' &&
                Object.getOwnPropertyDescriptor(obj, prop)?.get &&
                getters.indexOf(prop) === -1
            ) {
                getters.push(prop)
            }
        })
    } while ((obj = Object.getPrototypeOf(obj)))

    return getters
}

const bufferToJsonOriginal = (Buffer as any).toJSON
const bufferToJsonInspect = function (this: Buffer) { return this.toString('base64') }

/**
 * Small helper function that adds `toJSON` and `util.custom.inspect`
 * methods to a given class based on its getters
 *
 * > **Note**: This means that all getters must be pure!
 * > (getter that caches after its first invocation is also
 * > considered pure in this case)
 */
export function makeInspectable(
    obj: Function,
    props?: string[],
    hide?: string[]
): void {
    const getters: string[] = props ? props : []

    for (const key of getAllGettersNames(obj.prototype)) {
        if (!hide || hide.indexOf(key) === -1) getters.push(key)
    }

    // dirty hack to set name for inspect result
    const proto = new Function(`return function ${obj.name}(){}`)().prototype

    obj.prototype.toJSON = function (nested = false) {
        if (!nested) {
            (Buffer as any).toJSON = bufferToJsonInspect
        }

        const ret: any = Object.create(proto)
        getters.forEach((it) => {
            try {
                let val = this[it]
                if (
                    val &&
                    typeof val === 'object' &&
                    typeof val.toJSON === 'function'
                ) {
                    val = val.toJSON(true)
                }
                ret[it] = val
            } catch (e) {
                ret[it] = "Error: " + e.message
            }
        })

        if (!nested) {
            (Buffer as any).toJSON = bufferToJsonOriginal
        }

        return ret
    }
    if (util) {
        obj.prototype[util.inspect.custom] = obj.prototype.toJSON
    }
}
