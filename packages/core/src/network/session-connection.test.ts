import type { SessionConnection } from './session-connection.js'
import { StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

async function createConnection() {
  const client = new StubTelegramClient()
  await client.connect()

  const conn = client.mt.network._primaryDc!.main._connections[0] as SessionConnection & Record<string, any>

  return { client, conn }
}

function sendPing(conn: SessionConnection & Record<string, any>) {
  conn._session.lastPingTime = performance.now() - 1_000_000
  conn._flush()

  const msgId = conn._session.lastPingMsgId
  expect(msgId.isZero()).toBe(false)

  return { msgId, pingId: conn._session.pendingMessages.get(msgId)!.pingId as Long }
}

describe('SessionConnection', () => {
  describe('ping handling', () => {
    it('should handle pong to a ping that was sent before the connection became active', async () => {
      const { client, conn } = await createConnection()

      const idlePing = sendPing(conn)

      conn._session.pendingMessages.set(Long.fromNumber(1), {
        _: 'rpc',
        rpc: { method: 'help.getConfig', promise: { reject: () => {} } },
      })
      conn._session.lastPingTime = performance.now() - 1_000_000
      conn._flush()

      const activePing = { msgId: conn._session.lastPingMsgId }
      expect(activePing.msgId.eq(idlePing.msgId)).toBe(false)
      expect(conn._session.pendingMessages.has(idlePing.msgId)).toBe(true)

      const warn = vi.spyOn(conn.log, 'warn')
      conn._onPong({ _: 'mt_pong', msgId: idlePing.msgId, pingId: idlePing.pingId })

      expect(warn).not.toHaveBeenCalled()
      expect(conn._session.pendingMessages.has(idlePing.msgId)).toBe(false)
      expect(conn._session.lastPingMsgId.eq(activePing.msgId)).toBe(true)

      await client.destroy()
    })

    it('should not keep pending pings across reconnects', async () => {
      const { client, conn } = await createConnection()

      const ping = sendPing(conn)
      conn.reset()

      expect(conn._session.pendingMessages.has(ping.msgId)).toBe(false)
      expect(conn._session.lastPingMsgId.isZero()).toBe(true)

      await client.destroy()
    })
  })
})
