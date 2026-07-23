import type { mtp } from '../tl/index.js'
import type { PendingRpc } from './mtproto-session.js'
import type { ServerSaltManager } from './server-salt.js'
import type { SessionConnection } from './session-connection.js'
import { Deferred, timers } from '@fuman/utils'
import { StubTelegramClient } from '@mtcute/test'
import { TlBinaryWriter } from '@mtcute/tl-runtime'
import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

interface TestConnection {
  _active: boolean
  _cancelRpc(rpc: PendingRpc, onTimeout?: boolean, abortSignal?: AbortSignal): void
  _flush(): void
  _inactive: boolean
  _inactivityPendingFlush: boolean
  _isPfsBindingPending: boolean
  _isPfsBindingPendingInBackground: boolean
  _needDestroyAuthKey: boolean
  _onPong(message: { _: 'mt_pong', msgId: Long, pingId: Long }): void
  _pendingWaitForUnencrypted: unknown[]
  _pfsAuthorizationAbort?: AbortController
  _queuedDestroySession: Long[]
  _salts: ServerSaltManager
  _sentDestroyAuthKey: boolean
  _session: SessionConnection['_session']
  log: SessionConnection['log']
  onUpdate: SessionConnection['onUpdate']
  params: SessionConnection['params']
  reconnect: SessionConnection['reconnect']
  reset: SessionConnection['reset']
  setUsePfs: SessionConnection['setUsePfs']
  send: SessionConnection['send']
  sendRpc: SessionConnection['sendRpc']
  waitForUnencryptedMessage(timeout?: number, abortSignal?: AbortSignal): Promise<Uint8Array>
}

interface SessionConnectionInternals {
  _doFlush(context: { rpcToSend: PendingRpc[], ownsDestroyAuthKeySend: boolean }): void
  _onNewSessionCreated(message: mtp.RawMt_new_session_created): void
}

async function createConnection(usePfs = false) {
  const client = new StubTelegramClient(usePfs ? { network: { usePfs: true } } : undefined)
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

function expectRpcsRejected(rpcs: PendingRpc[]) {
  return Promise.all(rpcs.map(rpc => expect(rpc.promise.promise).rejects.toThrow('Session is reset')))
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
  describe('flush failure handling', () => {
    it('should settle fresh and resent RPCs when packet allocation fails before registration', async () => {
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

      const rejections = expectRpcsRejected(rpcs)
      conn._flush()
      await rejections

      const allocationCalls = allocatePacket.mock.calls.length
      const registrationCalls = setPending.mock.calls.length
      allocatePacket.mockRestore()
      setPending.mockRestore()

      expect(allocationCalls).toBe(1)
      expect(registrationCalls).toBe(0)
      expect(queuedAtAllocation).toBe(0)
      expect(conn._session.pendingMessages.size).toBe(0)
      expect(conn._session.queuedRpc).toHaveLength(0)
      expect(rpcs.every(rpc => rpc.done)).toBe(true)
      expect(conn.reconnect).not.toHaveBeenCalled()
      await client.destroy()
    })

    it('should settle every RPC once when packet construction partially registers a batch', async () => {
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

      const rejectRpcs = rpcs.map(rpc => vi.spyOn(rpc.promise, 'reject'))
      const rejections = expectRpcsRejected(rpcs)
      conn._flush()
      await rejections

      const registrationCalls = setPending.mock.calls.length
      setPending.mockRestore()

      expect(registrationCalls).toBe(2)
      expect(conn._session.pendingMessages.size).toBe(0)
      expect(conn._session.queuedRpc).toHaveLength(0)
      expect(rejectRpcs.every(reject => reject.mock.calls.length === 1)).toBe(true)
      expect(conn.reconnect).not.toHaveBeenCalled()
      await client.destroy()
    })

    it('should not restore an RPC that times out before its pending registration', async () => {
      const { client, conn } = await createConnection()
      const rpcs = [createRpc('rpc.one'), createRpc('rpc.two'), createRpc('rpc.three')]
      const resetAbortSignal = vi.fn()
      rpcs[1].resetAbortSignal = resetAbortSignal
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

      const terminalSettlement = expectRpcsRejected([rpcs[0], rpcs[2]])
      conn._flush()
      setPending.mockRestore()
      await Promise.all([timeoutSettlement, terminalSettlement])

      expect(conn._session.pendingMessages.size).toBe(0)
      expect(conn._session.queuedRpc).toHaveLength(0)
      expect(rpcs[1].cancelled).toBe(true)
      expect(rpcs[1].timeout).toBeUndefined()
      expect(rpcs[1].resetAbortSignal).toBeUndefined()
      expect(resetAbortSignal).toHaveBeenCalledOnce()
      expect(conn.reconnect).not.toHaveBeenCalled()
      await client.destroy()
    })

    it('should emit the exact error once without retrying and allow later work on a new session', async () => {
      const { client, conn } = await createConnection()
      const cause = new Error('controlled encryption failure')
      const onError = vi.fn()
      client.onError.add(onError)

      const oldSessionId = conn._session._sessionId
      const originalEncryptMessage = conn._session.encryptMessage.bind(conn._session)
      let fail = true
      const encryptMessage = vi.spyOn(conn._session, 'encryptMessage').mockImplementation((message) => {
        if (fail) throw cause
        return originalEncryptMessage(message)
      })
      vi.spyOn(conn, 'send').mockResolvedValue()
      const reconnect = vi.spyOn(conn, 'reconnect').mockImplementation(() => {})

      const failedRequest = conn.sendRpc({ _: 'help.getNearestDc' })
      await expect(failedRequest).rejects.toThrow('Session is reset')
      for (let i = 0; i < 5; i++) await Promise.resolve()

      expect(encryptMessage).toHaveBeenCalledOnce()
      expect(onError).toHaveBeenCalledOnce()
      expect(onError).toHaveBeenCalledWith(cause)
      expect(reconnect).not.toHaveBeenCalled()
      expect(conn._session._sessionId.eq(oldSessionId)).toBe(false)

      fail = false
      const laterRequest = conn.sendRpc({ _: 'help.getNearestDc' })
      for (let i = 0; i < 5; i++) await Promise.resolve()

      expect(encryptMessage).toHaveBeenCalledTimes(2)
      expect([...conn._session.pendingMessages.values()].some(info => info._ === 'rpc')).toBe(true)
      const laterRejection = expect(laterRequest).rejects.toThrow('Session is reset')
      conn._session.resetState()
      await laterRejection
      await client.destroy()
    })

    it('should normalize a cyclic non-Error value without bypassing settlement', async () => {
      const { client, conn } = await createConnection()
      const cause: Record<string, unknown> = {}
      cause.self = cause
      const onError = vi.fn()
      client.onError.add(onError)
      vi.spyOn(conn._session, 'encryptMessage').mockImplementation(() => {
        throw cause
      })

      const request = conn.sendRpc({ _: 'help.getNearestDc' })
      await expect(request).rejects.toThrow('Session is reset')

      expect(onError).toHaveBeenCalledOnce()
      const error = onError.mock.calls[0][0]
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Non-Error value thrown')
      expect((error as Error & { cause: unknown }).cause).toBe(cause)
      await client.destroy()
    })

    it('should cancel PFS waiters and clear terminal request hooks', async () => {
      const { client, conn } = await createConnection()
      const internals = conn as unknown as SessionConnectionInternals
      const rpc = createRpc('rpc.with-hooks')
      const resetAbortSignal = vi.fn()
      rpc.timeout = timers.setTimeout(() => {}, 60_000)
      rpc.resetAbortSignal = resetAbortSignal
      prepareFlush(conn, [rpc])

      const authorizationAbort = new AbortController()
      conn._pfsAuthorizationAbort = authorizationAbort
      conn._isPfsBindingPendingInBackground = true
      const authorizationWaiter = conn.waitForUnencryptedMessage(60_000, authorizationAbort.signal)
      const bind = new Deferred<boolean | mtp.RawMt_rpc_error>()
      conn._session.pendingMessages.set(Long.ONE, { _: 'bind', promise: bind })
      const getStateTimeout = timers.setTimeout(() => {}, 60_000)
      conn._session.pendingGetStateTimeouts.set(Long.fromNumber(2), getStateTimeout)

      const rpcRejection = expect(rpc.promise.promise).rejects.toThrow('Session is reset')
      const authorizationRejection = expect(authorizationWaiter).rejects.toThrow('Session is reset')
      const bindRejection = expect(bind.promise).rejects.toThrow('Session is reset')
      vi.spyOn(internals, '_doFlush').mockImplementation(() => {
        throw new Error('controlled packet failure')
      })
      const reconnect = vi.spyOn(conn, 'reconnect').mockImplementation(() => {})

      conn._flush()
      await Promise.all([rpcRejection, authorizationRejection, bindRejection])

      expect(authorizationAbort.signal.aborted).toBe(true)
      expect(conn._isPfsBindingPending).toBe(false)
      expect(conn._isPfsBindingPendingInBackground).toBe(false)
      expect(conn._pendingWaitForUnencrypted).toHaveLength(0)
      expect(resetAbortSignal).toHaveBeenCalledOnce()
      expect(rpc.done).toBe(true)
      expect(rpc.timeout).toBeUndefined()
      expect(rpc.resetAbortSignal).toBeUndefined()
      expect(conn._session.pendingGetStateTimeouts.size).toBe(0)
      expect(reconnect).not.toHaveBeenCalled()
      await client.destroy()
    })

    it('should cancel an active PFS attempt when PFS is disabled', async () => {
      const { client, conn } = await createConnection(true)
      const authorizationAbort = new AbortController()
      conn._pfsAuthorizationAbort = authorizationAbort
      conn._isPfsBindingPendingInBackground = true
      const authorizationWaiter = conn.waitForUnencryptedMessage(60_000, authorizationAbort.signal)
      const reconnect = vi.spyOn(conn, 'reconnect').mockImplementation(() => {})

      conn.setUsePfs(false)

      await expect(authorizationWaiter).rejects.toThrow('PFS setting changed')
      expect(authorizationAbort.signal.aborted).toBe(true)
      expect(conn._isPfsBindingPending).toBe(false)
      expect(conn._isPfsBindingPendingInBackground).toBe(false)
      expect(conn._pendingWaitForUnencrypted).toHaveLength(0)
      expect(reconnect).toHaveBeenCalledOnce()
      await client.destroy()
    })

    it('should cancel an earlier pending inactivity close', async () => {
      const { client, conn } = await createConnection()
      const firstSend = new Deferred<void>()
      const send = vi.spyOn(conn, 'send').mockReturnValueOnce(firstSend.promise)
      let fail = false
      vi.spyOn(conn._session, 'encryptMessage').mockImplementation(() => {
        if (fail) throw new Error('controlled packet failure')
        return new Uint8Array([1, 2, 3])
      })
      vi.spyOn(conn.log, 'error').mockImplementation(() => {})

      conn._session.lastActivityTime = performance.now()
      conn._session.lastPingTime = performance.now()
      conn._session.queuedAcks.push(Long.ONE)
      conn._inactivityPendingFlush = true
      conn._flush()

      expect(send).toHaveBeenCalledOnce()
      expect(conn._inactivityPendingFlush).toBe(true)

      fail = true
      const rpc = createRpc('rpc.after-inactivity-flush')
      prepareFlush(conn, [rpc])
      const rejection = expectRpcsRejected([rpc])
      conn._flush()
      await rejection

      expect(conn._inactivityPendingFlush).toBe(false)
      conn._inactivityPendingFlush = true
      firstSend.resolve()
      await firstSend.promise
      await Promise.resolve()

      expect(conn._inactive).toBe(false)
      expect(conn._inactivityPendingFlush).toBe(true)
      await client.destroy()
    })

    it('should roll back only service markers owned by the failed packet', async () => {
      const { client, conn } = await createConnection()
      const shouldFetchSalts = vi.spyOn(conn._salts, 'shouldFetchSalts').mockReturnValue(true)
      let failEncryption = true
      vi.spyOn(conn._session, 'encryptMessage').mockImplementation(() => {
        if (failEncryption) throw new Error('controlled service-packet failure')
        return new Uint8Array([1, 2, 3])
      })
      conn._needDestroyAuthKey = true
      conn._queuedDestroySession.push(Long.fromNumber(123))

      const firstRpc = createRpc('rpc.with-owned-service-state')
      prepareFlush(conn, [firstRpc])
      const firstRejection = expectRpcsRejected([firstRpc])
      conn._flush()
      await firstRejection

      expect(conn._salts.isFetching).toBe(false)
      expect(conn._needDestroyAuthKey).toBe(true)
      expect(conn._sentDestroyAuthKey).toBe(false)
      expect(conn._queuedDestroySession).toHaveLength(0)

      shouldFetchSalts.mockReturnValue(false)
      conn._salts.isFetching = true
      conn._sentDestroyAuthKey = true
      const secondRpc = createRpc('rpc.with-sibling-salt-state')
      prepareFlush(conn, [secondRpc])
      const secondRejection = expectRpcsRejected([secondRpc])
      conn._flush()
      await secondRejection

      expect(conn._salts.isFetching).toBe(true)
      expect(conn._sentDestroyAuthKey).toBe(true)

      failEncryption = false
      conn._salts.isFetching = false
      conn._sentDestroyAuthKey = false
      shouldFetchSalts.mockReturnValue(true)
      const markersAtSend = vi.spyOn(conn, 'send').mockImplementation(() => {
        expect(conn._salts.isFetching).toBe(true)
        expect(conn._sentDestroyAuthKey).toBe(true)
        throw new Error('controlled send handoff failure')
      })
      const sentRpc = createRpc('rpc.with-sent-service-state')
      prepareFlush(conn, [sentRpc])
      const sentRpcRejection = expectRpcsRejected([sentRpc])
      conn._flush()
      await sentRpcRejection

      expect(markersAtSend).toHaveBeenCalledOnce()
      expect(conn._salts.isFetching).toBe(false)
      expect(conn._sentDestroyAuthKey).toBe(false)
      expect(conn._needDestroyAuthKey).toBe(true)
      await client.destroy()
    })
  })

  it('should remember accepted session identifiers for missed-update recovery', async () => {
    const { client, conn } = await createConnection()
    const internals = conn as unknown as SessionConnectionInternals
    const onUpdate = vi.fn()
    conn.onUpdate.add(onUpdate)
    conn.params.disableUpdates = false

    internals._onNewSessionCreated({
      _: 'mt_new_session_created',
      firstMsgId: Long.ONE,
      uniqueId: Long.fromNumber(10),
      serverSalt: Long.fromNumber(20),
    })
    expect(conn._session.lastSessionCreatedUid.eq(Long.fromNumber(10))).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()

    internals._onNewSessionCreated({
      _: 'mt_new_session_created',
      firstMsgId: Long.fromNumber(2),
      uniqueId: Long.fromNumber(11),
      serverSalt: Long.fromNumber(21),
    })
    expect(conn._session.lastSessionCreatedUid.eq(Long.fromNumber(11))).toBe(true)
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate).toHaveBeenCalledWith({ _: 'updatesTooLong' })
    await client.destroy()
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
