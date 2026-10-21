import { testCryptoProvider } from '@mtcute/test'
import { describe } from 'vitest'

if (process.env.TEST_ENV === 'browser') {
  describe('WebCryptoProvider', async () => {
    const { WebCryptoProvider } = await import('./crypto.js')

    testCryptoProvider(new WebCryptoProvider())
  })
} else {
  describe.skip('WebCryptoProvider', () => {})
}
