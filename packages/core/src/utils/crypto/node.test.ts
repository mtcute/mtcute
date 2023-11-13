import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/test'

import { NodeCryptoProvider } from './node.js'

describe('NodeCryptoProvider', () => {
    if (typeof process === 'undefined') {
        console.warn('Skipping NodeCryptoProvider tests')

        return
    }

    testCryptoProvider(new NodeCryptoProvider())
})
