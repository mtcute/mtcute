/* eslint-disable unused-imports/no-unused-vars */
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
