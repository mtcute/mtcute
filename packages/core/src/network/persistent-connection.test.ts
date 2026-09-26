import type { BasicDcOption } from '../utils/index.js'
import type { PersistentConnectionParams } from './persistent-connection.js'
import type { ITelegramConnection, TelegramTransport } from './transports/abstract.js'
import { FakeConnection } from '@fuman/net'
import { defaultPlatform, defaultTestCryptoProvider } from '@mtcute/test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LogManager } from '../utils/index.js'
import { PersistentConnection } from './persistent-connection.js'
import { IntermediatePacketCodec } from './transports/intermediate.js'

class TestConnection extends PersistentConnection {
  constructor(params: PersistentConnectionParams) {
    super(params, new LogManager(undefined, defaultPlatform))
  }

  protected onConnected(): void {}
  protected onClosed(): void {}
  readonly errors: Error[] = []

  protected handleError(err: Error): void {
    this.errors.push(err)
  }

  protected onMessage(): void {}
}

const unreachable: BasicDcOption = { id: 5, ipAddress: '1.1.1.1', port: 443 }
const reachable: BasicDcOption = { id: 5, ipAddress: '2.2.2.2', port: 443 }

async function createConnection(params: {
  dc: BasicDcOption
  dcFallbacks?: BasicDcOption[]
  dcFailures?: Map<string, number>
  connect: (dc: BasicDcOption, signal: AbortSignal) => Promise<ITelegramConnection>
}) {
  const transport: TelegramTransport = {
    connect: params.connect,
    packetCodec: () => new IntermediatePacketCodec(),
  }

  return new TestConnection({
    crypto: await defaultTestCryptoProvider(),
    transport,
    dc: params.dc,
    dcFallbacks: params.dcFallbacks,
    dcFailures: params.dcFailures,
    testMode: false,
    reconnectionStrategy: () => 0,
  })
}

describe('PersistentConnection', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should switch to a fallback address when connecting fails', async () => {
    const attempts: string[] = []
    const conn = await createConnection({
      dc: unreachable,
      dcFallbacks: [reachable],
      connect: async (dc) => {
        attempts.push(dc.ipAddress)
        if (dc === unreachable) throw new Error('ECONNREFUSED')

        return new FakeConnection<BasicDcOption>(dc)
      },
    })

    conn.connect()
    await vi.waitFor(() => expect(conn.isConnected).toBe(true))

    expect(attempts).toEqual(['1.1.1.1', '2.2.2.2'])
    expect(conn.params.dc).toBe(reachable)
    // connect errors other than our own timeout are still reported
    expect(conn.errors.map(it => it.message)).toEqual(['ECONNREFUSED'])

    await conn.destroy()
  })

  it('should skip addresses that recently failed for other connections to the same dc', async () => {
    const dcFailures = new Map<string, number>()
    const attempts: string[] = []
    const connect = async (dc: BasicDcOption) => {
      attempts.push(dc.ipAddress)
      if (dc === unreachable) throw new Error('ECONNREFUSED')

      return new FakeConnection<BasicDcOption>(dc)
    }

    const first = await createConnection({ dc: unreachable, dcFallbacks: [reachable], dcFailures, connect })
    first.connect()
    await vi.waitFor(() => expect(first.isConnected).toBe(true))
    expect(attempts).toEqual(['1.1.1.1', '2.2.2.2'])

    const second = await createConnection({ dc: unreachable, dcFallbacks: [reachable], dcFailures, connect })
    second.connect()
    await vi.waitFor(() => expect(second.isConnected).toBe(true))
    expect(attempts).toEqual(['1.1.1.1', '2.2.2.2', '2.2.2.2'])
    expect(second.errors).toEqual([])

    await first.destroy()
    await second.destroy()
  })

  it('should report once per round over all addresses when none of them work', async () => {
    const other: BasicDcOption = { id: 5, ipAddress: '3.3.3.3', port: 443 }
    const attempts: string[] = []
    const conn = await createConnection({
      dc: unreachable,
      dcFallbacks: [other],
      connect: (dc, signal) => {
        attempts.push(dc.ipAddress)
        // stop the reconnection loop after 2 full rounds
        if (attempts.length > 4) {
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason))
          })
        }

        return Promise.reject(new Error('ECONNREFUSED'))
      },
    })

    const reported: Error[] = []
    conn.onError.add(err => reported.push(err))

    conn.connect()
    await vi.waitFor(() => expect(attempts).toHaveLength(5))

    expect(reported).toHaveLength(2)
    expect(reported[0].message).toContain('DC 5')
    expect(reported[0].message).toContain('1.1.1.1:443, 3.3.3.3:443')
    // individual failures are still passed to handleError as before
    expect(conn.errors).toHaveLength(4)

    await conn.destroy()
  })

  it('should retry addresses whose failure is too old', async () => {
    const attempts: string[] = []
    const conn = await createConnection({
      dc: reachable,
      dcFallbacks: [unreachable],
      dcFailures: new Map([['2.2.2.2:443', performance.now() - 600_001]]),
      connect: async (dc) => {
        attempts.push(dc.ipAddress)
        return new FakeConnection<BasicDcOption>(dc)
      },
    })

    conn.connect()
    await vi.waitFor(() => expect(conn.isConnected).toBe(true))
    expect(attempts).toEqual(['2.2.2.2'])

    await conn.destroy()
  })

  it('should wrap around to the first address after trying all fallbacks', async () => {
    const attempts: string[] = []
    let fail = 3
    const conn = await createConnection({
      dc: unreachable,
      dcFallbacks: [reachable],
      connect: async (dc) => {
        attempts.push(dc.ipAddress)
        if (fail-- > 0) throw new Error('ECONNREFUSED')

        return new FakeConnection<BasicDcOption>(dc)
      },
    })

    conn.connect()
    await vi.waitFor(() => expect(conn.isConnected).toBe(true))

    expect(attempts).toEqual(['1.1.1.1', '2.2.2.2', '1.1.1.1', '2.2.2.2'])

    await conn.destroy()
  })

  it('should time out a hanging connect when there are fallbacks', async () => {
    const attempts: string[] = []
    const conn = await createConnection({
      dc: unreachable,
      dcFallbacks: [unreachable, reachable], // duplicates are ignored
      connect: (dc, signal) => {
        attempts.push(dc.ipAddress)
        if (dc !== unreachable) return Promise.resolve(new FakeConnection<BasicDcOption>(dc))

        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
        })
      },
    })

    vi.useFakeTimers()
    conn.connect()
    await vi.advanceTimersByTimeAsync(14_000)
    expect(conn.isConnected).toBe(false)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(conn.isConnected).toBe(true)
    expect(attempts).toEqual(['1.1.1.1', '2.2.2.2'])
    // our own timeout is only logged, not reported
    expect(conn.errors).toEqual([])

    await conn.destroy()
  })

  it('should double the connect timeout after every failed round', async () => {
    const other: BasicDcOption = { id: 5, ipAddress: '3.3.3.3', port: 443 }
    const attempts: number[] = []
    const conn = await createConnection({
      dc: unreachable,
      dcFallbacks: [other],
      connect: (_, signal) => {
        attempts.push(Date.now())
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
        })
      },
    })

    vi.useFakeTimers()
    const start = Date.now()
    conn.connect()
    // round 1: 15s per address, round 2: 30s, then 60s max
    await vi.advanceTimersByTimeAsync(210_000)
    await vi.waitFor(() => expect(attempts).toHaveLength(7))

    expect(attempts.map(it => it - start)).toEqual([0, 15_000, 30_000, 60_000, 90_000, 150_000, 210_000])
    expect(conn.errors).toEqual([])

    await conn.destroy()
  })

  it('should not time out a connect when there are no fallbacks', async () => {
    const conn = await createConnection({
      dc: unreachable,
      connect: (_, signal) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason))
      }),
    })

    vi.useFakeTimers()
    conn.connect()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(conn.params.dc).toBe(unreachable)

    await conn.destroy()
  })

  it('should drop queued unencrypted messages', async () => {
    const conn = await createConnection({
      dc: reachable,
      connect: () => new Promise(() => {}),
    })

    const plain = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3])
    const encrypted = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3])

    const c = conn as unknown as { _sendOnceConnected: Uint8Array[], _dropQueuedPlainMessages: () => void }
    c._sendOnceConnected = [plain, encrypted]
    c._dropQueuedPlainMessages()

    expect(c._sendOnceConnected).toEqual([encrypted])
  })
})
