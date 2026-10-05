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

  describe('built-in dc fallbacks', () => {
    it('should be used for the primary dc', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const dc = client.mt.network._primaryDc!
      const fallbacks = dc.main._connections[0].params.dcFallbacks!

      expect(fallbacks.length).toBeGreaterThan(0)
      expect(fallbacks.every(it => it.id === dc.dcId && !it.ipv6)).toBe(true)

      await client.destroy()
    })

    it('should not be used with custom defaultDcs', async () => {
      const custom = { id: 2, ipAddress: '10.0.0.1', port: 443 }
      const client = new StubTelegramClient({ defaultDcs: { main: custom, media: custom } })
      await client.connect()

      expect(client.mt.network._primaryDc!.main._connections[0].params.dcFallbacks).toEqual([])

      await client.destroy()
    })
  })

  describe('fallbackDcs', () => {
    it('should replace the built-in production addresses', async () => {
      const fallback = { id: 2, ipAddress: '10.0.0.2', port: 443 }
      const client = new StubTelegramClient({ fallbackDcs: [fallback] })
      try {
        await client.connect()
        expect(client.mt.network._primaryDc!.main._connections[0].params.dcFallbacks).toEqual([fallback])
      } finally {
        await client.destroy()
      }
    })

    it('should disable fallbacks for the primary dc with an empty array', async () => {
      const client = new StubTelegramClient({ fallbackDcs: [] })
      try {
        await client.connect()
        expect(client.mt.network._primaryDc!.main._connections[0].params.dcFallbacks).toEqual([])
      } finally {
        await client.destroy()
      }
    })

    it('should not use production fallbacks in test mode by default', async () => {
      const client = new StubTelegramClient({ testMode: true })
      try {
        await client.connect()
        expect(client.mt.network._primaryDc!.main._connections[0].params.dcFallbacks).toEqual([])
      } finally {
        await client.destroy()
      }
    })

    it.each([false, true])('should filter custom fallbacks with useIpv6=%s', async (useIpv6) => {
      const custom = { id: 2, ipAddress: '10.0.0.1', port: 443 }
      const fallback = { id: 2, ipAddress: '10.0.0.2', port: 443 }
      const media = { id: 2, ipAddress: '10.0.0.3', port: 443, mediaOnly: true }
      const ipv6 = { id: 2, ipAddress: '::2', port: 443, ipv6: true }
      const client = new StubTelegramClient({
        defaultDcs: { main: custom, media: custom },
        fallbackDcs: [fallback, media, ipv6, { id: 5, ipAddress: '10.0.0.5', port: 443 }],
        useIpv6,
      })
      try {
        await client.connect()
        const dc = client.mt.network._primaryDc!
        expect(dc.main._connections[0].params.dcFallbacks).toEqual(useIpv6 ? [fallback, ipv6] : [fallback])
        expect(dc.download._connections[0].params.dcFallbacks)
          .toEqual(useIpv6 ? [fallback, media, ipv6] : [fallback, media])
      } finally {
        await client.destroy()
      }
    })

    it('should allow explicit fallbacks in test mode', async () => {
      const fallback = { id: 2, ipAddress: '10.0.0.2', port: 443, testMode: true }
      const client = new StubTelegramClient({ testMode: true, fallbackDcs: [fallback] })
      try {
        await client.connect()
        expect(client.mt.network._primaryDc!.main._connections[0].params.dcFallbacks).toEqual([fallback])
      } finally {
        await client.destroy()
      }
    })

    it.each([false, true])('should keep config alternatives with empty fallbackDcs=%s for secondary dcs', async (disabled) => {
      const fallback = { id: 5, ipAddress: '10.0.0.5', port: 443 }
      const main: tl.RawDcOption = { _: 'dcOption', id: 5, ipAddress: '10.0.0.1', port: 443 }
      const media: tl.RawDcOption = { ...main, ipAddress: '10.0.0.2', mediaOnly: true }
      const configFallback: tl.RawDcOption = { ...main, ipAddress: '10.0.0.3' }
      const client = new StubTelegramClient({ fallbackDcs: disabled ? [] : [fallback] })
      try {
        await client.connect()
        vi.spyOn(client.mt.network.config, 'findOptions').mockImplementation(async params =>
          params.allowMedia ? [media, main, configFallback] : [main, configFallback],
        )
        const dc = await client.mt.network._getOtherDc(5)
        expect(dc.main._connections[0].params.dcFallbacks)
          .toEqual(disabled ? [configFallback] : [configFallback, fallback])
        expect(dc.download._connections[0].params.dcFallbacks)
          .toEqual(disabled ? [main, configFallback] : [main, configFallback, fallback])
      } finally {
        await client.destroy()
      }
    })
  })

  describe('_getOtherDc', () => {
    it('should propagate DC creation errors', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      vi.spyOn(client.mt.network.config, 'findOptions').mockResolvedValue([])

      await expect(client.mt.call({ _: 'help.getNearestDc' }, { dcId: 9 })).rejects.toThrow('Could not find DC 9')

      await client.destroy()
    })
  })

  describe('changePrimaryDc', () => {
    it('should not leak listeners when switching between DCs', async () => {
      const client = new StubTelegramClient()
      await client.connect()

      const network = client.mt.network
      vi.spyOn(network.config, 'findOptions').mockImplementation(
        async (params): Promise<tl.RawDcOption[]> => [{
          _: 'dcOption',
          id: params.dcId,
          ipAddress: '1.2.3.4',
          port: 443,
        }],
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
