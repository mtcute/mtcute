import { createStub, StubTelegramClient } from '@mtcute/test'
import { describe, expect, it, vi } from 'vitest'

describe('BaseTelegramClient', () => {
  describe('destroy', () => {
    it('should reject an RPC response that arrives after destruction', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const nearestDc = createStub('nearestDc')
      let resolve!: (value: typeof nearestDc) => void
      const response = new Promise<typeof nearestDc>((r) => {
        resolve = r
      })
      vi.spyOn(client.mt, 'call').mockReturnValue(response)

      const request = client.call({ _: 'help.getNearestDc' })
      await client.destroy()
      resolve(nearestDc)

      await expect(request).rejects.toThrow('Client is destroyed')
    })

    it('should reject auth and DC continuations after destruction', async () => {
      const client = new StubTelegramClient()
      const notifyLoggedIn = vi.spyOn(client.mt.network, 'notifyLoggedIn')
      const notifyLoggedOut = vi.spyOn(client.mt.network, 'notifyLoggedOut')
      const changePrimaryDc = vi.spyOn(client.mt.network, 'changePrimaryDc')

      await client.destroy()

      await expect(client.notifyLoggedIn(createStub('user', { id: 1 }))).rejects.toThrow('Client is destroyed')
      await expect(client.notifyLoggedOut()).rejects.toThrow('Client is destroyed')
      await expect(client.changePrimaryDc(2)).rejects.toThrow('Client is destroyed')
      expect(notifyLoggedIn).not.toHaveBeenCalled()
      expect(notifyLoggedOut).not.toHaveBeenCalled()
      expect(changePrimaryDc).not.toHaveBeenCalled()
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
