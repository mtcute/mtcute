import * as vitestExpect from '@vitest/expect'
import * as vitestSpy from '@vitest/spy'
import { afterAll, afterEach, beforeAll, beforeEach, vi as bunVi, it, jest } from 'bun:test'
// https://github.com/oven-sh/bun/issues/6044
import * as chai from 'chai'

import { setupChai, stubGlobal, unstubAllGlobals, waitFor } from './polyfills'

setupChai(chai, vitestExpect)

export { afterAll, afterEach, beforeAll, beforeEach, it }
export const expect = chai.expect

export const vi = {
    ...jest,
    ...bunVi,
    ...vitestSpy,
    mocked: fn => fn,
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
