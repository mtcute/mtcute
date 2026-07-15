import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

describe('BaseTelegramClient', () => {
  describe('stop signal', () => {
    it('should only abort stopSignal on destroy, not on disconnect', async () => {
      const client = new StubTelegramClient()
      const signal = client.stopSignal

      await client.connect()
      await client.disconnect()
      expect(signal.aborted).toBe(false)

      await client.connect()
      await client.destroy()
      expect(signal.aborted).toBe(true)
      expect(client.stopSignal).toBe(signal)
    })

    it('should abort in-flight network waits on disconnect and reset them on reconnect', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const teardownSignal = client.mt.network.teardownSignal
      await client.disconnect()
      expect(teardownSignal.aborted).toBe(true)

      await client.connect()
      expect(client.mt.network.teardownSignal.aborted).toBe(false)

      await client.destroy()
      expect(client.mt.network.teardownSignal.aborted).toBe(true)
    })
  })

  describe('string sessions', () => {
    it('should export session', async () => {
      const client = new StubTelegramClient()
      const session = await client.exportSession()

      expect(session).toMatchInlineSnapshot(
        '"AwQAAAAXAgIADjE0OS4xNTQuMTY3LjUwALsBAAAXAgICDzE0OS4xNTQuMTY3LjIyMrsBAAD-AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
      )
    })
  })
})
