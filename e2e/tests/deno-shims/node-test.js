import * as bdd from 'jsr:@std/testing@1.0.5/bdd'

export function describe(name, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts
        opts = {}
    }

    bdd.describe(name, {
        ...opts,
        // we don't close @db/sqlite
        sanitizeResources: false,
    }, fn)
}
export const it = bdd.it
export const before = bdd.beforeAll
export const after = bdd.afterAll
