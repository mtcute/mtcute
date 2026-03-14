import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'

import { describe, expect, it, vi } from 'vitest'

import { setTyping } from './set-typing.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})

describe('setTyping', () => {
  it('should pass business connection id when cancelling typing', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    const call = vi.spyOn(client, 'call').mockResolvedValue(true as never)
    vi.spyOn(client.timers, 'cancel').mockResolvedValue(undefined)

    await setTyping(client, {
      peerId: stubUser.id,
      status: 'cancel',
      businessConnectionId: 'biz-123',
    })

    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      _: 'messages.setTyping',
      action: { _: 'sendMessageCancelAction' },
    }), {
      businessConnectionId: 'biz-123',
    })
  })
})
