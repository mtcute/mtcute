import type { PendingRpc } from './mtproto-session.js'
import type { SessionConnection } from './session-connection.js'
import { Deferred } from '@fuman/utils'
import { StubTelegramClient } from '@mtcute/test'
import { TlBinaryWriter } from '@mtcute/tl-runtime'
import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

interface TestConnection {
  _active: boolean
  _cancelRpc(rpc: PendingRpc, onTimeout?: boolean, abortSignal?: AbortSignal): void
  _flush(): void
  _onPong(message: { _: 'mt_pong', msgId: Long, pingId: Long }): void
  _session: SessionConnection['_session']
  log: SessionConnection['log']
  reconnect: SessionConnection['reconnect']
  reset: SessionConnection['reset']
  send: SessionConnection['send']
}

async function createConnection() {
  const client = new StubTelegramClient()
  await client.connect()

  const conn = client.mt.network._primaryDc!.main._connections[0] as unknown as TestConnection

  return { client, conn }
}

function createRpc(method: string): PendingRpc {
  return {
    method,
    promise: new Deferred<unknown>(),
    data: new Uint8Array([1, 2, 3, 4]),
  }
}

function prepareFlush(conn: TestConnection, rpcs: PendingRpc[]) {
  conn._active = true
  conn._session.lastActivityTime = performance.now()
  conn._session.lastPingTime = performance.now()
  rpcs.forEach(rpc => conn._session.enqueueRpc(rpc, true))
}

async function expectRpcsCanRetry(conn: TestConnection, rpcs: PendingRpc[]) {
  vi.spyOn(conn._session, 'encryptMessage').mockReturnValue(new Uint8Array([1, 2, 3]))
  vi.spyOn(conn, 'send').mockResolvedValue()

  conn._flush()

  for (const rpc of rpcs) {
    expect(rpc.msgId).toBeDefined()
    expect(conn._session.pendingMessages.get(rpc.msgId!)).toEqual({ _: 'rpc', rpc })
  }

  const containerId = rpcs[0].containerId!
  expect(rpcs.every(rpc => rpc.containerId?.eq(containerId))).toBe(true)
  const container = conn._session.pendingMessages.get(containerId)
  expect(container?._).toBe('container')
  if (container?._ === 'container') {
    const rpcMsgIds = container.msgIds.filter(msgId => rpcs.some(rpc => rpc.msgId!.eq(msgId)))
    expect(rpcMsgIds).toHaveLength(rpcs.length)
  }

  const rejections = rpcs.map(rpc => expect(rpc.promise.promise).rejects.toThrow('Session is reset'))
  conn._session.resetState()
  await Promise.all(rejections)
}

function sendPing(conn: TestConnection) {
  conn._session.lastPingTime = performance.now() - 1_000_000
  conn._flush()

  const msgId = conn._session.lastPingMsgId
  expect(msgId.isZero()).toBe(false)
  const pending = conn._session.pendingMessages.get(msgId)
  if (pending?._ !== 'ping') throw new Error('Expected pending ping')

  return {
    msgId,
    pingId: pending.pingId,
  }
}

describe('SessionConnection', () => {
  describe('flush failure recovery', () => {
    it('should retain fresh and resent RPCs when packet allocation fails before registration', async () => {
      const { client, conn } = await createConnection()
      const rpcs = [createRpc('rpc.one'), createRpc('rpc.two'), createRpc('rpc.three')]

      rpcs[0].msgId = Long.fromNumber(4)
      rpcs[0].seqNo = 1
      conn._session.pendingMessages.set(rpcs[0].msgId, { _: 'rpc', rpc: rpcs[0] })
      prepareFlush(conn, rpcs)

      vi.spyOn(conn, 'reconnect').mockImplementation(() => {})
      vi.spyOn(conn.log, 'error').mockImplementation(() => {})
      const setPending = vi.spyOn(conn._session.pendingMessages, 'set')
      let queuedAtAllocation = -1
      const allocatePacket = vi.spyOn(TlBinaryWriter, 'alloc').mockImplementation(() => {
        queuedAtAllocation = conn._session.queuedRpc.length
        throw new Error('injected packet construction failure')
      })

      conn._flush()

      const allocationCalls = allocatePacket.mock.calls.length
      const registrationCalls = setPending.mock.calls.length
      allocatePacket.mockRestore()
      setPending.mockRestore()

      expect(allocationCalls).toBe(1)
      expect(registrationCalls).toBe(0)
      expect(queuedAtAllocation).toBe(0)
      expect(conn._session.pendingMessages.size).toBe(0)
      expect(conn._session.queuedRpc.toArray()).toEqual(rpcs)
      rpcs.forEach((rpc) => {
        expect(rpc.msgId).toBeUndefined()
        expect(rpc.sent).toBe(false)
        expect(rpc.containerId).toBeUndefined()
      })

      await expectRpcsCanRetry(conn, rpcs)
      await client.destroy()
    })

    it('should retain every RPC when packet construction partially registers a batch', async () => {
      const { client, conn } = await createConnection()
      const rpcs = [createRpc('rpc.one'), createRpc('rpc.two'), createRpc('rpc.three')]
      rpcs.forEach((rpc) => {
        rpc.chainId = 'ordered'
      })
      prepareFlush(conn, rpcs)

      vi.spyOn(conn, 'reconnect').mockImplementation(() => {})
      vi.spyOn(conn.log, 'error').mockImplementation(() => {})
      const originalSetPending = conn._session.pendingMessages.set.bind(conn._session.pendingMessages)
      let registeredRpcs = 0
      const setPending = vi.spyOn(conn._session.pendingMessages, 'set').mockImplementation((msgId, pending) => {
        if (pending._ === 'rpc' && ++registeredRpcs === 2) {
          throw new Error('injected packet construction failure')
        }

        return originalSetPending(msgId, pending)
      })

      conn._flush()

      const registrationCalls = setPending.mock.calls.length
      setPending.mockRestore()

      expect(registrationCalls).toBe(2)
      expect(conn._session.pendingMessages.size).toBe(0)
      // Session reset appends registered RPCs, so exact order matters for chainId retries.
      expect(conn._session.queuedRpc.toArray()).toEqual(rpcs)

      await expectRpcsCanRetry(conn, rpcs)
      expect(rpcs[0].invokeAfter).toBeUndefined()
      expect(rpcs[1].invokeAfter?.eq(rpcs[0].msgId!)).toBe(true)
      expect(rpcs[2].invokeAfter?.eq(rpcs[1].msgId!)).toBe(true)
      await client.destroy()
    })

    it('should not restore an RPC that times out before its pending registration', async () => {
      const { client, conn } = await createConnection()
      const rpcs = [createRpc('rpc.one'), createRpc('rpc.two'), createRpc('rpc.three')]
      prepareFlush(conn, rpcs)

      vi.spyOn(conn, 'reconnect').mockImplementation(() => {})
      vi.spyOn(conn.log, 'error').mockImplementation(() => {})
      const originalSetPending = conn._session.pendingMessages.set.bind(conn._session.pendingMessages)
      let registeredRpcs = 0
      const setPending = vi.spyOn(conn._session.pendingMessages, 'set').mockImplementation((msgId, pending) => {
        if (pending._ === 'rpc' && ++registeredRpcs === 2) {
          conn._cancelRpc(pending.rpc, true)
          throw new Error('injected packet construction failure')
        }

        return originalSetPending(msgId, pending)
      })
      const timeoutSettlement = expect(rpcs[1].promise.promise).resolves.toMatchObject({
        _: 'mt_rpc_error',
        errorMessage: 'TIMEOUT',
      })

      conn._flush()
      setPending.mockRestore()

      const retainedRpcs = [rpcs[0], rpcs[2]]
      expect(conn._session.pendingMessages.size).toBe(0)
      expect(conn._session.queuedRpc.toArray()).toEqual(retainedRpcs)
      expect(rpcs[1].cancelled).toBe(true)

      await expectRpcsCanRetry(conn, retainedRpcs)
      await timeoutSettlement
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
