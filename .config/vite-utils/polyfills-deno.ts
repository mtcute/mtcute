import util from 'node:util'

// @ts-expect-error  no typings
import { describe as _describe, afterAll, afterEach, beforeAll, beforeEach, it } from 'jsr:@std/testing/bdd'
// @ts-expect-error  no typings
import * as vitestSpy from 'npm:@vitest/spy@1.4.0'
// @ts-expect-error  no typings
import * as chai from 'npm:chai'
// @ts-expect-error  no typings
import * as vitestExpect from 'npm:@vitest/expect@1.4.0'

import { setupChai, stubGlobal, unstubAllGlobals, waitFor } from './polyfills'

export { it, beforeEach, afterEach, beforeAll, afterAll }

setupChai(chai, vitestExpect)

// https://github.com/denoland/deno_std/issues/2213
Object.defineProperty(it, 'each', {
    // eslint-disable-next-line ts/no-unsafe-function-type
    value: (items: any[][]) => (name: string, fn: Function) => {
        return items.map((item) => {
            return it(`${util.format(name, ...item)}`, () => fn(...item))
        })
    },
})

// https://github.com/denoland/deno_std/issues/4634
export function describe(...args) {
    const fn = args.find(arg => typeof arg === 'function')
    if (fn.toString().startsWith('async')) {
        return
    }

    return _describe(...args)
}
describe.skip = _describe.skip
describe.only = _describe.only
describe.ignore = _describe.ignore

export const expect = chai.expect

export const vi = {
    ...vitestSpy,
    mocked: (fn: any) => fn,
    stubGlobal,
    unstubAllGlobals,
    waitFor,
    // todo use @sinonjs/fake-timers (see https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/mock/timers.ts)
    ...['setSystemTime', 'advanceTimersByTimeAsync', 'advanceTimersByTime', 'doMock'].reduce(
        (acc, name) => ({
            ...acc,
            [name]: () => {
                throw new Error(name)
            },
        }),
        {},
    ),
}
