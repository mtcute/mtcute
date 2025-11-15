/* eslint-disable ts/no-unsafe-assignment */
/* eslint-disable ts/no-unsafe-call,ts/no-unsafe-argument */

import { base64 } from '@fuman/utils'
import Long from 'long'

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

// get all property names. unlike Object.getOwnPropertyNames,
// also gets inherited property names
function getAllGettersNames<T>(obj: T): (keyof T)[] {
  const getters: (keyof T)[] = []

  do {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (
        prop !== '__proto__'
        && Object.getOwnPropertyDescriptor(obj, prop)?.get
        && !getters.includes(prop as any)
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
  const getters: (keyof T)[] = props || []

  for (const key of getAllGettersNames<T>(obj.prototype)) {
    if (!hide || !hide.includes(key)) getters.push(key)
  }

  // dirty hack to set name for inspect result
  const proto = ({ [obj.name]: class {} })[obj.name].prototype

  obj.prototype.toJSON = function () {
    const ret: any = Object.create(proto)
    getters.forEach((it) => {
      try {
        let val = this[it]

        if (val && typeof val === 'object') {
          if (val instanceof Uint8Array) {
            val = base64.encode(val)
          } else if (Long.isLong(val)) {
            val = val.toString()
          } else if (typeof val.toJSON === 'function') {
            val = val.toJSON(true)
          }
        }
        ret[it] = val
      } catch (e: any) {
        ret[it] = `Error: ${e.message}`
      }
    })

    // eslint-disable-next-line ts/no-unsafe-return
    return ret
  }
  obj.prototype[customInspectSymbol] = obj.prototype.toJSON

  return obj
}
