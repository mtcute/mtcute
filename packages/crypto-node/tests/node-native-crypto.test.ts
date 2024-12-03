import { testCryptoProvider } from '@mtcute/test'
import { describe } from 'vitest'

if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
    describe('NodeNativeCryptoProvider', async () => {
        const { NodeNativeCryptoProvider } = await import('../src/index.js')

        testCryptoProvider(new NodeNativeCryptoProvider())
    })
} else {
    describe.skip('NodeNativeCryptoProvider', () => {})
}
