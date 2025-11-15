import { testCryptoProvider } from '@mtcute/test'
import { describe } from 'vitest'

if (import.meta.env.TEST_ENV === 'deno') {
  describe('DenoCryptoProvider', async () => {
    const { DenoCryptoProvider } = await import('./crypto.js')

    testCryptoProvider(new DenoCryptoProvider())
  })
} else {
  describe.skip('DenoCryptoProvider', () => {})
}
