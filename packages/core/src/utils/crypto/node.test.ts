import { describe } from 'vitest'

import { testCryptoProvider } from './crypto.test-utils.js'
import { NodeCryptoProvider } from './node.js'

describe('NodeCryptoProvider', () => {
    if (typeof process === 'undefined') {
        console.warn('Skipping NodeCryptoProvider tests')

        return
    }

    testCryptoProvider(new NodeCryptoProvider())
})
