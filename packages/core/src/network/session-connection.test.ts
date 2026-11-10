import type { SessionConnection } from './session-connection.js'
import { Deferred } from '@fuman/utils'
import { StubTelegramClient } from '@mtcute/test'
import { TlBinaryReader } from '@mtcute/tl-runtime'
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
  conn['_flush']()

  const msgId = conn._session.lastPingMsgId
  expect(msgId.isZero()).toBe(false)

  return {
    msgId,
    pingId: (conn._session.pendingMessages.get(msgId)! as any).pingId as Long,
  }
}

describe('SessionConnection', () => {
  describe('read timeout', () => {
    it('should reset the session when nothing was read for too long', async () => {
      const { client, conn } = await createConnection()

      const reset = vi.spyOn(conn, '_resetSession')
      conn._session.lastActivityTime = performance.now() - 1_000_000
      conn['_flush']()

      expect(reset).toHaveBeenCalledWith('read timeout')

      await client.destroy()
    })

    it('should not reset the session while the socket is not open yet', async () => {
      const { client, conn } = await createConnection()

      // own property, so that the getter on the prototype stays intact for other tests
      Object.defineProperty(conn, 'isConnected', { get: () => false })
      const reset = vi.spyOn(conn, '_resetSession')
      conn._session.lastActivityTime = performance.now() - 1_000_000
      conn['_flush']()

      expect(reset).not.toHaveBeenCalled()

      await client.destroy()
    })
  })

  describe('unknown objects', () => {
    function unreadableMessage(conn: SessionConnection & Record<string, any>) {
      // an object id that is in no reader map, so reading it throws TlUnknownObjectError
      const data = new Uint8Array(4)
      new DataView(data.buffer).setUint32(0, 0xDEADBEEF, true)

      return new TlBinaryReader(conn._readerMap, data)
    }

    it('should ack and drop an unreadable object instead of resetting the session', async () => {
      const { client, conn } = await createConnection()

      const reset = vi.spyOn(conn, '_resetSession')
      const ack = vi.spyOn(conn, '_sendAck')
      const msgId = Long.fromBits(1, 0x5F00_0000) // odd, so it is not ignored as invalid

      conn['_handleRawMessage'](msgId, 0, unreadableMessage(conn))

      // the ack is what stops the server from re-delivering it (and us from looping)
      expect(ack).toHaveBeenCalledWith(msgId)
      expect(reset).not.toHaveBeenCalled()

      await client.destroy()
    })

    it('should keep handling the rest of a container after an unreadable object', async () => {
      const { client, conn } = await createConnection()

      const handle = vi.spyOn(conn, '_handleMessage')
      const reset = vi.spyOn(conn, '_resetSession')
      const firstMsgId = Long.fromBits(1, 0x5F00_0000)
      const secondMsgId = Long.fromBits(3, 0x5F00_0000)

      conn['_handleRawMessage'](firstMsgId, 0, unreadableMessage(conn))
      // mt_msgs_ack, which every reader map knows
      const ackMessage = new Uint8Array(12)
      const dv = new DataView(ackMessage.buffer)
      dv.setUint32(0, 0x62D6B459, true) // mt_msgs_ack
      dv.setUint32(4, 0x1CB5C415, true) // vector
      dv.setUint32(8, 0, true) // empty
      conn['_handleRawMessage'](secondMsgId, 0, new TlBinaryReader(conn._readerMap, ackMessage))

      expect(reset).not.toHaveBeenCalled()
      expect(handle).toHaveBeenCalledTimes(1)
      expect(handle.mock.calls[0][0]).toBe(secondMsgId)

      await client.destroy()
    })
  })

  describe('authorization', () => {
    it('should not start the handshake while the socket is not open yet', async () => {
      const { client, conn } = await createConnection()

      Object.defineProperty(conn, 'isConnected', { get: () => false })
      const authBegin = vi.fn()
      conn.onAuthBegin.add(authBegin)
      conn._authorize()

      expect(conn._session.authorizationPending).toBe(false)
      expect(authBegin).not.toHaveBeenCalled()

      await client.destroy()
    })
  })

  describe('ping handling', () => {
    it('should handle pong to a ping that was sent before the connection became active', async () => {
      const { client, conn } = await createConnection()

      const idlePing = sendPing(conn)

      const def = new Deferred<unknown>()
      def.promise.catch(() => {})
      conn._session.pendingMessages.set(Long.fromNumber(1), {
        _: 'rpc',
        rpc: { method: 'help.getConfig', promise: def, data: new Uint8Array() },
      })
      conn._session.lastPingTime = performance.now() - 1_000_000
      conn['_flush']()

      const activePing = { msgId: conn._session.lastPingMsgId }
      expect(activePing.msgId.eq(idlePing.msgId)).toBe(false)
      expect(conn._session.pendingMessages.has(idlePing.msgId)).toBe(true)

      const warn = vi.spyOn(conn.log, 'warn')
      conn['_onPong']({ _: 'mt_pong', msgId: idlePing.msgId, pingId: idlePing.pingId })

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
