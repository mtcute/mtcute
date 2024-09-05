import { expect } from 'vitest'
import { typed } from '@fuman/utils'

import { setPlatform } from '../../packages/core/src/platform.js'

// @ts-expect-error no .env here
if (import.meta.env.TEST_ENV === 'browser' || import.meta.env.TEST_ENV === 'deno') {
    setPlatform(new (await import('../../packages/web/src/platform.js')).WebPlatform())
} else {
    setPlatform(new (await import('../../packages/node/src/common-internals-node/platform.js')).NodePlatform())
}

// consider Buffers equal to Uint8Arrays
expect.addEqualityTesters([
    function (a, b) {
        if (a instanceof Uint8Array && b instanceof Uint8Array) {
            return typed.equal(a, b)
        }
    },
])
