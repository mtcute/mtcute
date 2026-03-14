import { describe, expect, it, vi } from 'vitest'
import { serializeError } from './errors.js'
import { WorkerInvoker } from './invoker.js'
import { serializeResult } from './protocol.js'

describe('worker/invoker', () => {
  it('should send lifecycle and invoke messages with worker and connection ids', async () => {
    const send = vi.fn()
    const invoker = new WorkerInvoker(send, 'worker-1', 'connection-1')

    invoker.connect()

    const promise = invoker.invoke('custom', 'echo', ['hello'])

    expect(send).toHaveBeenNthCalledWith(1, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'connect',
    })

    expect(send).toHaveBeenNthCalledWith(2, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'invoke',
      id: 0,
      target: 'custom',
      method: 'echo',
      args: serializeResult(['hello']),
      void: false,
      withAbort: false,
    })

    invoker.handleResult({
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'result',
      id: 0,
      result: serializeResult('world'),
    })

    await expect(promise).resolves.toBe('world')
  })

  it('should send aborts and reject pending requests on release', async () => {
    const send = vi.fn()
    const invoker = new WorkerInvoker(send, 'worker-1', 'connection-1')
    const abortController = new AbortController()

    const promise = invoker.invokeWithAbort('client', 'call', [{ _: 'test.wait' }], abortController.signal)

    abortController.abort(new Error('cancelled'))

    expect(send).toHaveBeenNthCalledWith(1, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'invoke',
      id: 0,
      target: 'client',
      method: 'call',
      args: serializeResult([{ _: 'test.wait' }]),
      void: false,
      withAbort: true,
    })

    expect(send).toHaveBeenNthCalledWith(2, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'abort',
      id: 0,
    })

    invoker.release()

    expect(send).toHaveBeenNthCalledWith(3, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'release',
    })

    await expect(promise).rejects.toThrow('Worker connection closed')
    await expect(invoker.invoke('custom', 'echo', [])).rejects.toThrow('Worker connection closed')
  })

  it('should deserialize remote errors', async () => {
    const send = vi.fn()
    const invoker = new WorkerInvoker(send, 'worker-1', 'connection-1')

    const promise = invoker.invoke('custom', 'explode', [])

    invoker.handleResult({
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'result',
      id: 0,
      error: serializeError(new Error('boom')),
    })

    await expect(promise).rejects.toThrow('boom')
  })

  it('should send heartbeats and preserve remote expiration errors', async () => {
    const send = vi.fn()
    const invoker = new WorkerInvoker(send, 'worker-1', 'connection-1')

    invoker.connect()
    invoker.heartbeat()

    const promise = invoker.invoke('custom', 'echo', [])
    invoker.expire()

    expect(send).toHaveBeenNthCalledWith(2, {
      _mtcuteWorkerId: 'worker-1',
      connectionId: 'connection-1',
      type: 'heartbeat',
    })

    await expect(promise).rejects.toThrow('Worker connection expired')
    await expect(invoker.invoke('custom', 'echo', [])).rejects.toThrow('Worker connection expired')
  })
})
