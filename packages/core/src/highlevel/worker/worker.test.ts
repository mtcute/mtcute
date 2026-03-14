/* eslint-disable ts/no-unsafe-assignment, ts/no-unsafe-argument, ts/no-unsafe-return, ts/no-unsafe-call */
import type { RpcCallOptions } from '../../network/network-manager.js'
import type { CurrentUserInfo } from '../storage/service/current-user.js'

import type { ClientMessageHandler, RespondFn, SendFn, SomeWorker, WorkerCustomMethods, WorkerInboundMessage, WorkerMessageHandler, WorkerOutboundMessage } from './protocol.js'
import { Emitter, unsafeCastType } from '@fuman/utils'
import { createStub, defaultPlatform, StubTelegramClient } from '@mtcute/test'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TelegramWorkerPort } from './port.js'
import { TelegramWorker } from './worker.js'

const testPlatform = Object.assign(
  Object.create(Object.getPrototypeOf(defaultPlatform)),
  defaultPlatform,
  { beforeExit: () => () => {} },
)

async function flushMessages(times = 6): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
  }
}

class TestEndpoint<Out, In> {
  peer?: TestEndpoint<In, Out>

  readonly message = new Emitter<In>()

  postMessage(message: Out): void {
    queueMicrotask(() => {
      this.peer!.message.emit(message as any)
    })
  }
}

function createChannel(): {
  main: TestEndpoint<WorkerInboundMessage, WorkerOutboundMessage>
  worker: TestEndpoint<WorkerOutboundMessage, WorkerInboundMessage>
} {
  const main = new TestEndpoint<WorkerInboundMessage, WorkerOutboundMessage>()
  const worker = new TestEndpoint<WorkerOutboundMessage, WorkerInboundMessage>()

  main.peer = worker
  worker.peer = main

  return { main, worker }
}

class TestSharedClient extends StubTelegramClient {
  constructor(
    initialSelf: CurrentUserInfo | null = {
      userId: 1,
      isBot: false,
      isPremium: false,
      usernames: ['alice'],
    },
    callImpl?: (message: any, params?: RpcCallOptions) => Promise<unknown>,
  ) {
    super({
      platform: testPlatform,
    })

    const client = this as TestSharedClient

    ;(client.storage.self as any)._cached = initialSelf

    vi.spyOn(client, 'disconnect').mockImplementation(async () => {
      client.timers.destroy()
    })
    vi.spyOn(client, 'destroy').mockImplementation(async () => {
      await client.disconnect()
      ;(client.mt as any)._abortController.abort()
    })
    vi.spyOn(client, 'notifyLoggedOut').mockImplementation(async () => {
      await client.storage.self.store(null)
    })
    vi.spyOn(client, 'notifyLoggedIn').mockImplementation(async (auth) => {
      const user = auth._ === 'auth.authorization' ? auth.user : auth

      await client.storage.self.storeFrom(user as any)

      return user as any
    })
    vi.spyOn(client, 'importSession').mockImplementation(async () => {
      await client.storage.self.store({
        userId: 77,
        isBot: false,
        isPremium: false,
        usernames: ['imported'],
      })
    })
    vi.spyOn(client, 'exportSession').mockResolvedValue('session')
    vi.spyOn(client, 'call').mockImplementation((message, params) => {
      if (callImpl) return callImpl(message, params)

      return Promise.resolve({ message, params }) as any
    })
  }
}

class TestWorker<T extends WorkerCustomMethods> extends TelegramWorker<T> {
  private _endpoint: TestEndpoint<WorkerOutboundMessage, WorkerInboundMessage>

  constructor(
    params: ConstructorParameters<typeof TelegramWorker<T>>[0],
    endpoint: TestEndpoint<WorkerOutboundMessage, WorkerInboundMessage>,
  ) {
    super(params)
    this._endpoint = endpoint
  }

  registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction] {
    const endpoint = this._endpoint
    const respond: RespondFn = endpoint.postMessage.bind(endpoint)
    const messageHandler = (message: WorkerInboundMessage) => handler(message, respond)
    endpoint.message.add(messageHandler)

    return [respond, () => endpoint.message.remove(messageHandler)]
  }
}

class TestWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPort<T> {
  constructor(worker: TestEndpoint<WorkerInboundMessage, WorkerOutboundMessage>) {
    super({
      worker: worker as any,
      platform: testPlatform,
    })
  }

  connectToWorker(
    worker: SomeWorker,
    handler: ClientMessageHandler,
  ): [SendFn, () => void] {
    unsafeCastType<TestEndpoint<WorkerInboundMessage, WorkerOutboundMessage>>(worker)
    worker.message.add(handler)

    return [
      worker.postMessage.bind(worker),
      () => worker.message.remove(handler),
    ]
  }
}

function createHarness<T extends WorkerCustomMethods = WorkerCustomMethods>(params?: {
  client?: TestSharedClient
  customMethods?: T
  onLastDisconnected?: 'destroy' | 'disconnect' | 'nothing'
}) {
  const channel = createChannel()
  const client = params?.client ?? new TestSharedClient()
  const worker = new TestWorker({
    client,
    customMethods: params?.customMethods,
    onLastDisconnected: params?.onLastDisconnected,
  }, channel.worker).mount()

  return {
    channel,
    client,
    worker,
    createPort: () => new TestWorkerPort<T>(channel.main),
  }
}

describe('worker/port', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should route colliding invoke ids to the right port', async () => {
    const customMethods = {
      echo: vi.fn(async (value: string) => {
        await flushMessages(1)
        return `${value}:done`
      }),
    }

    const harness = createHarness({ customMethods })
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    const invokeIds: number[] = []
    const captureInvoke = (message: WorkerInboundMessage) => {
      if (message.type === 'invoke' && message.target === 'custom' && message.method === 'echo') {
        invokeIds.push(message.id)
      }
    }
    harness.channel.worker.message.add(captureInvoke)

    const p1 = port1.invokeCustom('echo', 'first')
    const p2 = port2.invokeCustom('echo', 'second')

    await flushMessages(1)

    expect(invokeIds).toEqual([0, 0])

    await expect(p1).resolves.toBe('first:done')
    await expect(p2).resolves.toBe('second:done')

    harness.channel.worker.message.remove(captureInvoke)
    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should abort only the matching port call', async () => {
    let resolveSecond!: (value: unknown) => void

    const harness = createHarness({
      client: new TestSharedClient(undefined, (message, params) => {
        if (message.token === 'first') {
          return new Promise((_, reject) => {
            params?.abortSignal?.addEventListener('abort', () => reject(new Error('first aborted')), { once: true })
          })
        }

        return new Promise((resolve, reject) => {
          resolveSecond = resolve
          params?.abortSignal?.addEventListener('abort', () => reject(new Error('second aborted')), { once: true })
        })
      }),
    })
    const port1 = harness.createPort()
    const port2 = harness.createPort()
    const abort1 = new AbortController()
    const abort2 = new AbortController()

    const p1 = port1.call({ _: 'test.wait', token: 'first' } as any, { abortSignal: abort1.signal })
    const p2 = port2.call({ _: 'test.wait', token: 'second' } as any, { abortSignal: abort2.signal })

    abort1.abort()

    await expect(p1).rejects.toThrow('first aborted')

    let secondSettled = false
    void p2.then(() => {
      secondSettled = true
    })

    expect(secondSettled).toBe(false)

    resolveSecond('second ok')
    await expect(p2).resolves.toBe('second ok')

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should sync self cache across ports', async () => {
    const harness = createHarness()
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    await Promise.all([port1.connect(), port2.connect()])

    expect(port1.storage.self.getCached(true)?.userId).toBe(1)
    expect(port2.storage.self.getCached(true)?.userId).toBe(1)

    await port1.notifyLoggedOut()

    expect(port1.storage.self.getCached(true)).toBeNull()
    expect(port2.storage.self.getCached(true)).toBeNull()

    await port1.notifyLoggedIn(createStub('user', { id: 9, username: 'bob' }))

    expect(port1.storage.self.getCached(true)?.userId).toBe(9)
    expect(port2.storage.self.getCached(true)?.usernames).toEqual(['bob'])

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should coordinate shared rpc timers across ports', async () => {
    vi.useFakeTimers()

    let ownedTicks = 0
    const harness = createHarness({
      client: new TestSharedClient(undefined, async (message) => {
        if (message._ === 'messages.setTyping') {
          ownedTicks++
        }

        return undefined
      }),
    })
    const port1 = harness.createPort()

    await port1.timers.upsert({
      kind: 'rpc',
      key: 'typing:1',
      interval: 100,
      startNow: true,
      request: {
        _: 'messages.setTyping',
        peer: { _: 'inputPeerSelf' },
        action: { _: 'sendMessageTypingAction' },
      },
    })

    await vi.advanceTimersByTimeAsync(250)

    expect(ownedTicks).toBeGreaterThan(1)

    const port2 = harness.createPort()

    await expect(port2.timers.exists('typing:1')).resolves.toBe(true)

    const beforeReown = ownedTicks
    await port2.timers.upsert({
      kind: 'rpc',
      key: 'typing:1',
      interval: 100,
      startNow: true,
      request: {
        _: 'messages.setTyping',
        peer: { _: 'inputPeerSelf' },
        action: { _: 'sendMessageTypingAction' },
      },
    })

    await vi.advanceTimersByTimeAsync(150)

    expect(ownedTicks - beforeReown).toBeLessThanOrEqual(2)

    const ticksBeforeCancel = ownedTicks
    await port2.timers.cancel('typing:1')
    await vi.advanceTimersByTimeAsync(200)

    await expect(port1.timers.exists('typing:1')).resolves.toBe(false)
    await expect(port2.timers.exists('typing:1')).resolves.toBe(false)
    expect(ownedTicks).toBe(ticksBeforeCancel)

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should clear shared timers on direct disconnect', async () => {
    vi.useFakeTimers()

    let ticks = 0
    const harness = createHarness({
      client: new TestSharedClient(undefined, async (message) => {
        if (message._ === 'account.updateStatus' && message.offline === false) {
          ticks++
        }

        return undefined
      }),
    })
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    await port1.timers.upsert({
      kind: 'rpc',
      key: 'online',
      interval: 50,
      request: { _: 'account.updateStatus', offline: false },
    })

    await vi.advanceTimersByTimeAsync(120)
    expect(ticks).toBeGreaterThan(0)

    const beforeDisconnect = ticks
    await port2.disconnect()
    await vi.advanceTimersByTimeAsync(120)

    expect(harness.client.disconnect).toHaveBeenCalledTimes(1)
    expect(ticks).toBe(beforeDisconnect)
    await expect(port1.timers.exists('online')).resolves.toBe(false)
    await expect(port2.timers.exists('online')).resolves.toBe(false)

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should respect onLastDisconnected policies', async () => {
    const nothing = createHarness()
    const portNothing = nothing.createPort()
    await portNothing.destroy()
    await flushMessages()
    expect(nothing.client.disconnect).not.toHaveBeenCalled()
    expect(nothing.client.destroy).not.toHaveBeenCalled()
    nothing.worker.destroy()

    const disconnect = createHarness({ onLastDisconnected: 'disconnect' })
    const portDisconnect = disconnect.createPort()
    await portDisconnect.destroy()
    await flushMessages()
    expect(disconnect.client.disconnect).toHaveBeenCalledTimes(1)
    expect(disconnect.client.destroy).not.toHaveBeenCalled()
    disconnect.worker.destroy()

    const destroy = createHarness({ onLastDisconnected: 'destroy' })
    const portDestroy = destroy.createPort()
    await portDestroy.destroy()
    await flushMessages()
    expect(destroy.client.destroy).toHaveBeenCalledTimes(1)
    destroy.worker.destroy()
  })

  it('should keep the shared client alive while another idle port is still connected', async () => {
    const harness = createHarness({ onLastDisconnected: 'destroy' })
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    await port1.destroy()
    await flushMessages()

    expect(harness.client.destroy).not.toHaveBeenCalled()

    await port2.destroy()
    await flushMessages()

    expect(harness.client.destroy).toHaveBeenCalledTimes(1)
    harness.worker.destroy()
  })

  it('should send heartbeat messages and keep live ports from expiring', async () => {
    vi.useFakeTimers()

    const harness = createHarness()
    const inbound: WorkerInboundMessage[] = []
    const outbound: WorkerOutboundMessage[] = []
    const onMessage = (message: WorkerInboundMessage) => {
      inbound.push(message)
    }
    const onOutbound = (message: WorkerOutboundMessage) => {
      outbound.push(message)
    }

    harness.channel.worker.message.add(onMessage)
    harness.channel.main.message.add(onOutbound)
    const port = harness.createPort()
    await flushMessages()

    expect(inbound).toContainEqual({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: port.connectionId,
      type: 'connect',
    })

    await vi.advanceTimersByTimeAsync(70_000)

    const heartbeats = inbound.filter(message => message.type === 'heartbeat' && message.connectionId === port.connectionId)

    expect(heartbeats).toHaveLength(7)
    expect(outbound).not.toContainEqual({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: port.connectionId,
      type: 'connection_expired',
    })
    expect(harness.worker.activeConnections.has(port.connectionId)).toBe(true)
    expect(port.stopSignal.aborted).toBe(false)

    harness.channel.worker.message.remove(onMessage)
    harness.channel.main.message.remove(onOutbound)
    await port.destroy()
    harness.worker.destroy()
  })

  it('should expire stale connections in the worker core', async () => {
    vi.useFakeTimers()

    const harness = createHarness()
    const messages: WorkerOutboundMessage[] = []
    const staleConnectionId = 'stale-connection'
    const onMessage = (message: WorkerOutboundMessage) => messages.push(message)

    harness.channel.main.message.add(onMessage)
    harness.channel.main.postMessage({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: staleConnectionId,
      type: 'connect',
    })
    await flushMessages()

    expect(harness.worker.activeConnections.has(staleConnectionId)).toBe(true)

    await vi.advanceTimersByTimeAsync(60_000)
    await flushMessages()

    expect(harness.worker.activeConnections.has(staleConnectionId)).toBe(false)
    expect(messages).toContainEqual({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: staleConnectionId,
      type: 'connection_expired',
    })

    harness.channel.main.postMessage({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: staleConnectionId,
      type: 'invoke',
      id: 0,
      target: 'custom',
      method: 'echo',
      args: [] as any,
      void: false,
      withAbort: false,
    })
    await flushMessages()

    expect(messages).toContainEqual({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: staleConnectionId,
      type: 'connection_expired',
    })

    harness.channel.main.message.remove(onMessage)
    harness.worker.destroy()
  })

  it('should close ports when the worker expires their connection', async () => {
    const harness = createHarness()
    const port = harness.createPort()
    const onError = vi.fn()

    port.onError.add(onError)

    harness.channel.worker.postMessage({
      _mtcuteWorkerId: harness.worker.workerId,
      connectionId: port.connectionId,
      type: 'connection_expired',
    })
    await flushMessages()

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe('Worker connection expired')
    expect(port.stopSignal.aborted).toBe(true)
    await expect(port.call({ _: 'test.wait' } as any)).rejects.toThrow('Worker connection expired')

    await port.destroy()
    harness.worker.destroy()
  })

  it('should force destroy regardless of refcount policy and broadcast stop', async () => {
    const harness = createHarness({ onLastDisconnected: 'nothing' })
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    // unsafeForceDestroy may reject because the stop broadcast closes the port
    await port1.unsafeForceDestroy().catch(() => {})
    await flushMessages()

    expect(harness.client.destroy).toHaveBeenCalledTimes(1)
    expect(port1.stopSignal.aborted).toBe(true)
    expect(port2.stopSignal.aborted).toBe(true)

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should abort pending abortable calls on force destroy', async () => {
    const harness = createHarness({
      client: new TestSharedClient(undefined, (_message, params) => new Promise((_, reject) => {
        params?.abortSignal?.addEventListener('abort', () => reject(new Error('call aborted')), { once: true })
      })),
      onLastDisconnected: 'nothing',
    })
    const port1 = harness.createPort()
    const port2 = harness.createPort()
    const abort = new AbortController()

    const pending = port2.call({ _: 'test.wait' } as any, { abortSignal: abort.signal })
    await flushMessages()

    await port1.unsafeForceDestroy().catch(() => {})
    await flushMessages()

    // port2's pending call is rejected either with the abort error or with connection expired
    await expect(pending).rejects.toThrow()

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })

  it('should reject pending non-abortable calls on force destroy', async () => {
    const customMethods = {
      wait: vi.fn(() => new Promise(() => {})),
    }

    const harness = createHarness({
      customMethods,
      onLastDisconnected: 'nothing',
    })
    const port1 = harness.createPort()
    const port2 = harness.createPort()

    const pending = port2.invokeCustom('wait')
    await flushMessages()

    await port1.unsafeForceDestroy().catch(() => {})
    await flushMessages()

    await expect(pending).rejects.toThrow('Worker connection expired')

    await Promise.all([port1.destroy(), port2.destroy()])
    harness.worker.destroy()
  })
})
