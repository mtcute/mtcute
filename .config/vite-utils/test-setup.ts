import { expect } from 'vitest'
import { typed } from '@fuman/utils'

// consider Buffers equal to Uint8Arrays
expect.addEqualityTesters([
    function (a, b) {
        if (a instanceof Uint8Array && b instanceof Uint8Array) {
            return typed.equal(a, b)
        }
    },
])
