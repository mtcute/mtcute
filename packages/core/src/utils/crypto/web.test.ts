import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/test'

import { WebCryptoProvider } from './web.js'

describe('WebCryptoProvider', async () => {
    let crypto = globalThis.crypto

    if (!crypto && typeof process !== 'undefined') {
        crypto = await import('crypto').then((m) => m.webcrypto as Crypto)
    }

    if (!crypto) {
        console.warn('Skipping WebCryptoProvider tests (no webcrypto)')

        return
    }

    testCryptoProvider(new WebCryptoProvider({ crypto }))
})
