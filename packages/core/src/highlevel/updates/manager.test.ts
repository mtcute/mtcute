import type { UpdatesManager } from './manager.js'
import { createStub, StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { PeersIndex } from '../types/peers/peers-index.js'
import { toPendingUpdate } from './utils.js'

const CHANNEL_ID = 123123

function createUpdatesManager(): UpdatesManager {
  const client = new StubTelegramClient({ disableUpdates: false })

  return client.updates!
}

async function feedUpdateChannel(updates: UpdatesManager, peers: PeersIndex): Promise<void> {
  const pending = toPendingUpdate({ _: 'updateChannel', channelId: CHANNEL_ID }, peers)
  await updates._onUpdate(pending, new Map())
}

describe('updateChannel handling', () => {
  it('should clear inaccessibleChannels when the channel is not in the peers index', async () => {
    const updates = createUpdatesManager()
    updates.inaccessibleChannels.add(CHANNEL_ID)

    const peers = PeersIndex.from({ users: [createStub('user', { id: 456 })] })
    await feedUpdateChannel(updates, peers)

    expect(updates.inaccessibleChannels.has(CHANNEL_ID)).toBe(false)
  })

  it('should clear inaccessibleChannels when the channel is accessible', async () => {
    const updates = createUpdatesManager()
    updates.inaccessibleChannels.add(CHANNEL_ID)

    const peers = PeersIndex.from({ chats: [createStub('channel', { id: CHANNEL_ID })] })
    await feedUpdateChannel(updates, peers)

    expect(updates.inaccessibleChannels.has(CHANNEL_ID)).toBe(false)
  })

  it('should keep inaccessibleChannels when the channel is forbidden', async () => {
    const updates = createUpdatesManager()
    updates.inaccessibleChannels.add(CHANNEL_ID)

    const peers = PeersIndex.from({ chats: [createStub('channelForbidden', { id: CHANNEL_ID })] })
    await feedUpdateChannel(updates, peers)

    expect(updates.inaccessibleChannels.has(CHANNEL_ID)).toBe(true)
  })
})
