import type { tl } from '../tl/index.js'
import { timers } from '@fuman/utils'
import { StubTelegramClient, StubTelegramTransport } from '@mtcute/test'
import { describe, expect, it, vi } from 'vitest'

const sleep = (ms: number) => new Promise<void>(resolve => timers.setTimeout(resolve, ms))

describe('NetworkManager', () => {
  describe('destroy', () => {
    it('should reject calls that reach the network layer after destroy', async () => {
      const client = new StubTelegramClient()
      await client.connect()
      await client.destroy()

      await expect(client.mt.call({ _: 'help.getNearestDc' })).rejects.toThrow('Not connected to any DC')
    })

    it('should reject calls sent to a stale connection after destroy', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const dc = client.mt.network._primaryDc!
      await client.destroy()

      await expect(dc.main.sendRpc({ _: 'help.getNearestDc' })).rejects.toThrow('Connection destroyed')
    })

    it('should not reconnect after destroy', async () => {
      let connects = 0
      const client = new StubTelegramClient({
        transport: new StubTelegramTransport({
          onConnect: () => {
            connects += 1
          },
        }),
      })
      await client.connect()

      const dc = client.mt.network._primaryDc!
      const conn = dc.main._connections[0]
      await client.destroy()
      await sleep(10)

      const before = connects
      conn.connect()
      conn.reconnect()
      await expect(client.mt.network.connect(client.mt._defaultDcs)).rejects.toThrow('Network manager is destroyed')
      await expect(client.mt.network.changePrimaryDc(2)).rejects.toThrow('Network manager is destroyed')
      await sleep(10)

      expect(connects).toBe(before)
    })

    it('should allow reconnecting after disconnect', async () => {
      const client = new StubTelegramClient()
      await client.connect()
      await client.disconnect()
      await client.connect()

      expect(client.mt.network._primaryDc).toBeDefined()

      await client.destroy()
    })
  })

  describe('_getOtherDc', () => {
    it('should propagate DC creation errors', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      vi.spyOn(client.mt.network.config, 'findOption').mockResolvedValue(undefined)

      await expect(client.mt.call({ _: 'help.getNearestDc' }, { dcId: 9 })).rejects.toThrow('Could not find DC 9')

      await client.destroy()
    })
  })

  describe('changePrimaryDc', () => {
    it('should not leak listeners when switching between DCs', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const network = client.mt.network
      vi.spyOn(network.config, 'findOption').mockImplementation(
        async (params): Promise<tl.RawDcOption> => ({
          _: 'dcOption',
          id: params.dcId,
          ipAddress: '1.2.3.4',
          port: 443,
        }),
      )

      const dc1 = network._primaryDc!
      const listenersWhenPrimary = dc1.main.onUpdate.length

      await network.changePrimaryDc(5)
      expect(dc1.main.onUpdate.length).toBe(listenersWhenPrimary - 1)

      const dc5 = network._primaryDc!
      expect(dc5.dcId).toBe(5)
      expect(dc5.main.onUpdate.length).toBe(listenersWhenPrimary)

      await network.changePrimaryDc(dc1.dcId)
      expect(dc1.main.onUpdate.length).toBe(listenersWhenPrimary)
      expect(dc5.main.onUpdate.length).toBe(listenersWhenPrimary - 1)

      await client.destroy()
    })
  })
})
