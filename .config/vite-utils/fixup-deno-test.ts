// @ts-expect-error  no typings
import { describe as _describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'jsr:@std/testing/bdd'
// @ts-expect-error  no typings
import * as vitestSpy from 'npm:@vitest/spy'
// @ts-expect-error  no typings
import * as chai from 'npm:chai'
// @ts-expect-error  no typings
import * as vitestExpect from 'npm:@vitest/expect'
import util from 'node:util'
import { setupChai } from './chai-setup'

export { it, beforeEach, afterEach, beforeAll, afterAll }

setupChai(chai, vitestExpect)

Object.defineProperty(it, 'each', {
    value: (items: any[][]) => (name: string, fn: Function) => {
        return items.map((item) => {
            return it(`${util.format(name, ...item)}`, () => fn(...item))
        })
    },
})

export const describe = (...args) => {
    const fn = args.find((arg) => typeof arg === 'function')
    if (fn.toString().startsWith('async')) {
        // https://github.com/denoland/deno_std/issues/4634
        return
    }

    return _describe(...args)
}
describe.skip = _describe.skip
describe.only = _describe.only
describe.ignore = _describe.ignore

export const expect = chai.expect

const stubbedGlobal = new Map()
function stubGlobal(name, value) {
    stubbedGlobal.set(name, globalThis[name])
    globalThis[name] = value
}

function unstubAllGlobals() {
    for (const [name, value] of stubbedGlobal) {
        globalThis[name] = value
    }
    stubbedGlobal.clear()
}

export const vi = {
    ...vitestSpy,
    mocked: (fn: any) => fn,
    stubGlobal,
    unstubAllGlobals,
    waitFor: async (fn: Function) => {
        // less customizations than vi.waitFor but it's good enough for now
        const timeout = Date.now() + 5000

        let lastError: unknown
        while (Date.now() < timeout) {
            try {
                return await fn()
            } catch (e) {
                lastError = e
                await new Promise((resolve) => setTimeout(resolve, 10))
            }
        }

        throw lastError
    },
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
