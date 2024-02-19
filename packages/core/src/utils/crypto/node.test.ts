import { describe } from 'vitest'

import { testCryptoProvider } from '@mtcute/test'

if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
    describe('NodeCryptoProvider', async () => {
        const { NodeCryptoProvider } = await import('./node.js')

        testCryptoProvider(new NodeCryptoProvider())
    })
} else {
    describe.skip('NodeCryptoProvider', () => {})
}
