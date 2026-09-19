import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it, vi } from 'vitest'

import { setChatColor } from './set-chat-color.js'

describe('setChatColor', () => {
  it('should update color for self', async () => {
    const client = new StubTelegramClient()
    await client.storage.self.store({
      userId: 1,
      isBot: false,
      isPremium: false,
      usernames: [],
    })

    const call = vi.spyOn(client, 'call')
    client.respondWith('account.updateColor', () => true)

    await client.with(() => setChatColor(client, { color: 1 }))

    expect(call).toHaveBeenCalledOnce()
    expect(call.mock.calls[0][0]).toMatchObject({
      _: 'account.updateColor',
      color: { _: 'peerColor', color: 1 },
    })
  })
})
