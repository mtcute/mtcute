import { testCryptoProvider } from '@mtcute/test'
import { describe } from 'vitest'

if (process.env.TEST_ENV === 'bun') {
  describe('BunCryptoProvider', async () => {
    const { BunCryptoProvider } = await import('./crypto.js')

    testCryptoProvider(new BunCryptoProvider())
  })
} else {
  describe.skip('BunCryptoProvider', () => {})
}
