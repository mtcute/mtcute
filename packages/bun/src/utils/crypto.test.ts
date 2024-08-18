import { describe } from 'vitest'
import { testCryptoProvider } from '@mtcute/test'

if (import.meta.env.TEST_ENV === 'bun') {
    describe('BunCryptoProvider', async () => {
        const { BunCryptoProvider } = await import('./crypto.js')

        testCryptoProvider(new BunCryptoProvider())
    })
} else {
    describe.skip('BunCryptoProvider', () => {})
}
