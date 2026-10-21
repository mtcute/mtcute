import { sleep } from '@fuman/utils'
import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { Conversation } from './conversation.js'
import { Message } from './messages/message.js'
import { PeersIndex } from './peers/peers-index.js'

describe('Conversation', () => {
  const create = async () => {
    const client = new StubTelegramClient()
    client.respondWith('messages.getPeerDialogs', () =>
      createStub('messages.peerDialogs', { dialogs: [], messages: [], chats: [], users: [] }))
    await client.registerPeers(createStub('user', { id: 1, accessHash: Long.ZERO }))

    const conv = new Conversation(client, 1)
    await conv.start()

    const peers = new PeersIndex()
    peers.users.set(1, createStub('user', { id: 1 }))
    const deliver = (id: number) => {
      const msg = new Message(createStub('message', { id, peerId: { _: 'peerUser', userId: 1 } }), peers)
      Conversation.handleUpdate(client, { name: 'new_message', data: msg })
    }

    return { conv, deliver }
  }

  it('should reject pending waiters with disabled timeout on stop', async () => {
    const { conv } = await create()

    const promise = conv.waitForNewMessage(undefined, null)
    const edit = conv.waitForEdit(undefined, { message: 5, timeout: null })

    conv.stop()

    await expect(promise).rejects.toThrow('Conversation stopped')
    await expect(edit).rejects.toThrow('Conversation stopped')
  })

  it('should keep messages arriving back to back for the next waiter', async () => {
    const { conv, deliver } = await create()

    const first = conv.waitForNewMessage()
    deliver(1)
    deliver(2)

    expect((await first).id).toBe(1)
    expect((await conv.waitForNewMessage(undefined, 100)).id).toBe(2)

    conv.stop()
  })

  it('should deliver messages to waiters in order', async () => {
    const { conv, deliver } = await create()

    const slowFilter = async () => {
      await sleep(1)
      return true
    }
    const waiters = [
      conv.waitForNewMessage(slowFilter, 100),
      conv.waitForNewMessage(undefined, 100),
      conv.waitForNewMessage(slowFilter, 100),
    ]
    deliver(1)
    deliver(2)
    deliver(3)

    expect((await Promise.all(waiters)).map(it => it.id)).toEqual([1, 2, 3])

    conv.stop()
  })

  it('should pass the message to the next waiter if the current one times out during its filter', async () => {
    const { conv, deliver } = await create()

    const first = conv.waitForNewMessage(async () => {
      await sleep(30)
      return true
    }, 10)
    const second = conv.waitForNewMessage(undefined, 100)
    deliver(1)

    await expect(first).rejects.toThrow()
    expect((await second).id).toBe(1)

    conv.stop()
  })

  it('should not carry messages over a restart that happened during a filter', async () => {
    const { conv, deliver } = await create()

    const first = conv.waitForNewMessage(async () => {
      await sleep(10)
      return true
    }, null)
    deliver(1)

    conv.stop()
    await expect(first).rejects.toThrow('Conversation stopped')
    await conv.start()

    const second = conv.waitForNewMessage(undefined, 100)
    await sleep(20)
    deliver(2)
    expect((await second).id).toBe(2)

    conv.stop()
  })
})
