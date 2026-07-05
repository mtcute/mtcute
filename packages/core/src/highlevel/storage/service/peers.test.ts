import { createStub, StubMemoryTelegramStorage, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('PeersService', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should keep flushing pending writes after the first flush', async () => {
    const storage = new StubMemoryTelegramStorage()
    const storeSpy = vi.spyOn(storage.peers, 'store')

    const client = new StubTelegramClient({ storage })
    await client.prepare()

    const user = createStub('user', { id: 1, accessHash: Long.fromInt(123) })

    await client.storage.peers.updatePeersFrom([user])
    expect(storeSpy).toHaveBeenCalledTimes(1)

    await client.storage.peers.updatePeersFrom([user])
    await vi.advanceTimersByTimeAsync(30_000)
    expect(storeSpy).toHaveBeenCalledTimes(2)

    await client.storage.peers.updatePeersFrom([user])
    await vi.advanceTimersByTimeAsync(30_000)
    expect(storeSpy).toHaveBeenCalledTimes(3)

    await client.destroy()
  })
})
