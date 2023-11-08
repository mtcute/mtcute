import { describe } from 'vitest'

import { testCryptoProvider } from './crypto.test-utils.js'
import { WebCryptoProvider } from './web.js'

describe('WebCryptoProvider', async () => {
    let subtle = globalThis.crypto?.subtle

    if (!subtle && typeof process !== 'undefined') {
        subtle = await import('crypto').then((m) => m.subtle)
    }

    if (!subtle) {
        console.warn('Skipping WebCryptoProvider tests (no crypto.subtle)')

        return
    }

    testCryptoProvider(new WebCryptoProvider({ subtle }))
})
