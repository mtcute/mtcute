import { testCryptoProvider } from '@mtcute/test'
import { describe } from 'vitest'

if (process.env.TEST_ENV === 'node') {
  describe('NodeCryptoProvider', async () => {
    const { NodeCryptoProvider } = await import('./crypto.js')

    testCryptoProvider(new NodeCryptoProvider())
  })
} else {
  describe.skip('NodeCryptoProvider', () => {})
}
