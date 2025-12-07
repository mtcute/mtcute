import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

describe('TelegramClient', () => {
  describe('platform property', () => {
    it('should expose platform property from internal client', () => {
      const client = new StubTelegramClient()

      // Vvrify that platform is accesible and not undefined
      // this was a bug reported by Anton Rudnikov where client.platform returned undefined
      expect(client.platform).toBeDefined()
      expect(client.platform).not.toBeUndefined()
    })

    it('should allow accessing platform.beforeExit', () => {
      const client = new StubTelegramClient()

      // this is the use case mentioned by Anton Rudnikov
      // users shloud be able to access platform.beforeExit to add custom cleanup logic
      expect(client.platform.beforeExit).toBeDefined()
      expect(typeof client.platform.beforeExit).toBe('function')
    })
  })
})
