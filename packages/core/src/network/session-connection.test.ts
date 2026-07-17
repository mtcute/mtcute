import type { mtp } from '../tl/index.js'
import type { PendingRpc } from './mtproto-session.js'

import { Deferred } from '@fuman/utils'
import { defaultCryptoProvider, defaultPlatform, StubTelegramTransport } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

import { __tlReaderMap, __tlWriterMap, LogManager } from '../utils/index.js'
import { ServerSaltManager } from './server-salt.js'
import { SessionConnection } from './session-connection.js'

interface SessionConnectionInternals {
  _active: boolean
  _activeFlushRpcs: PendingRpc[] | null
  _flush: () => void
  _fuman: { reconnect: (force: boolean) => void }
  _inactivityPendingFlush: boolean
  _sendOnceConnected: Uint8Array[]
  _writer?: { write: (data: Uint8Array) => Promise<void> }
}

function createConnection() {
  const connection = new SessionConnection(
    {
      crypto: defaultCryptoProvider,
      transport: new StubTelegramTransport({}),
      dc: {
        id: 2,
        ipAddress: '127.0.0.1',
        port: 443,
      },
      testMode: false,
      reconnectionStrategy: () => false,
      initConnection: {
        _: 'initConnection',
        apiId: 0,
        deviceModel: '',
        systemVersion: '',
        appVersion: '',
        systemLangCode: '',
        langPack: '',
        langCode: '',
        query: { _: 'help.getNearestDc' },
      },
      pingInterval: 60_000,
      layer: 1,
      disableUpdates: true,
      withUpdates: false,
      isMainConnection: true,
      isMainDcConnection: true,
      usePfs: false,
      salts: new ServerSaltManager(),
      readerMap: __tlReaderMap,
      writerMap: __tlWriterMap,
      platform: defaultPlatform,
    },
    new LogManager(undefined, defaultPlatform),
  )
  const internals = connection as unknown as SessionConnectionInternals

  connection._session._authKey.ready = true
  connection._inactive = false
  internals._active = true
  connection._session.lastActivityTime = performance.now()
  connection._session.lastPingTime = performance.now()

  return { connection, internals }
}

function createRpc(): PendingRpc {
  return {
    method: 'help.getNearestDc',
    data: new Uint8Array([1, 2, 3, 4]),
    promise: new Deferred<unknown>(),
  }
}

describe('SessionConnection flush', () => {
  it('settles a synchronous flush failure without resending its session payload', async () => {
    const { connection, internals } = createConnection()
    const fumanReconnect = vi.fn()
    internals._fuman = { reconnect: fumanReconnect }

    await connection.send(new Uint8Array([1, 2, 3]))
    expect(internals._sendOnceConnected).toHaveLength(1)

    const pendingWrite = new Deferred<void>()
    const write = vi.fn(() => pendingWrite.promise)
    internals._writer = { write }
    const inFlightSend = connection.send(new Uint8Array([4, 5, 6]))
    expect(write).toHaveBeenCalledOnce()

    const rpc = createRpc()
    const resetAbortSignal = vi.fn()
    rpc.resetAbortSignal = resetAbortSignal
    const rejectRpc = vi.spyOn(rpc.promise, 'reject')
    connection._session.enqueueRpc(rpc, true)

    const bind = new Deferred<boolean | mtp.RawMt_rpc_error>()
    const rejectBind = vi.spyOn(bind, 'reject')
    connection._session.pendingMessages.set(Long.ONE, { _: 'bind', promise: bind })

    const rpcRejection = expect(rpc.promise.promise).rejects.toThrow('MTProto flush failed')
    const bindRejection = expect(bind.promise).rejects.toThrow('MTProto flush failed')
    const cause = new WebAssembly.RuntimeError('controlled encryption failure')
    const encrypt = vi.spyOn(connection._session, 'encryptMessage').mockImplementation(() => {
      internals._flush()
      throw cause
    })
    const resetConnection = vi.spyOn(connection, 'reset')
    const resetSession = vi.spyOn(connection._session, 'reset')
    const reconnect = vi.spyOn(connection, 'reconnect').mockImplementation(() => {})
    const onError = vi.fn()
    connection.onError.add(onError)
    const logError = vi.spyOn(connection.log, 'error').mockImplementation(() => {})
    internals._inactivityPendingFlush = true

    internals._flush()
    await Promise.all([rpcRejection, bindRejection])

    pendingWrite.reject(new Error('late write failure'))
    await inFlightSend

    expect(encrypt).toHaveBeenCalledOnce()
    expect(rejectRpc).toHaveBeenCalledOnce()
    expect(rejectBind).toHaveBeenCalledOnce()
    expect(rejectRpc.mock.calls[0][0]).toMatchObject({ message: 'MTProto flush failed' })
    expect(rejectBind.mock.calls[0][0]).toBe(rejectRpc.mock.calls[0][0])
    expect(resetAbortSignal).toHaveBeenCalledOnce()
    expect(rpc.done).toBe(true)
    expect(connection._session.queuedRpc).toHaveLength(0)
    expect(connection._session.pendingMessages.size).toBe(0)
    expect(internals._activeFlushRpcs).toBeNull()
    expect(internals._sendOnceConnected).toHaveLength(0)
    expect(internals._writer).toBeUndefined()
    expect(internals._inactivityPendingFlush).toBe(false)
    expect(resetConnection).toHaveBeenCalledOnce()
    expect(resetSession).toHaveBeenCalledOnce()
    expect(reconnect).toHaveBeenCalledOnce()
    expect(resetConnection.mock.invocationCallOrder[0]).toBeLessThan(resetSession.mock.invocationCallOrder[0])
    expect(resetSession.mock.invocationCallOrder[0]).toBeLessThan(reconnect.mock.invocationCallOrder[0])
    expect(fumanReconnect).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(cause)
    expect(logError).toHaveBeenCalledOnce()
    expect(logError).toHaveBeenCalledWith('flush error')
  })

  it('clears active RPC tracking after successful and empty flushes', () => {
    const { connection, internals } = createConnection()
    const rpc = createRpc()
    connection._session.enqueueRpc(rpc, true)

    vi.spyOn(connection, 'send').mockResolvedValue()
    vi.spyOn(connection._session, 'encryptMessage').mockImplementation(() => {
      expect(internals._activeFlushRpcs).toEqual([rpc])
      return new Uint8Array([1, 2, 3])
    })

    internals._flush()
    expect(internals._activeFlushRpcs).toBeNull()

    connection._session.pendingMessages.clear()
    connection._session.getStateSchedule.clear()
    let activeDuringEmptyFlush: PendingRpc[] | null = null
    vi.spyOn(connection.log, 'debug').mockImplementation((message) => {
      if (message === 'flushing send queue. queued rpc: %d') {
        activeDuringEmptyFlush = internals._activeFlushRpcs
      }
    })

    internals._flush()

    expect(activeDuringEmptyFlush).toEqual([])
    expect(internals._activeFlushRpcs).toBeNull()
    connection.reset()
  })
})
