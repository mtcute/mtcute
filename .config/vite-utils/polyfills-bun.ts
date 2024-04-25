import { describe, it, beforeEach, afterEach, beforeAll, afterAll, jest, vi as bunVi } from 'bun:test'
// https://github.com/oven-sh/bun/issues/6044
import console from 'console'
import * as chai from 'chai'
import * as vitestExpect from '@vitest/expect'
import * as vitestSpy from '@vitest/spy'
import { setupChai, stubGlobal, unstubAllGlobals, waitFor } from './polyfills'

setupChai(chai, vitestExpect)

export { it, beforeEach, afterEach, beforeAll, afterAll }
export const expect = chai.expect

export const vi = {
    ...jest,
    ...bunVi,
    ...vitestSpy,
    mocked: (fn) => fn,
    stubGlobal,
    unstubAllGlobals,
    waitFor,
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
