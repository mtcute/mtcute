import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/test'

if (import.meta.env.TEST_ENV === 'deno') {
    describe('DenoCryptoProvider', async () => {
        const { DenoCryptoProvider } = await import('./crypto.js')

        testCryptoProvider(new DenoCryptoProvider())
    })
} else {
    describe.skip('DenoCryptoProvider', () => {})
}
