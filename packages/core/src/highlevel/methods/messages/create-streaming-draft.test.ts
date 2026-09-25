import type { tl } from '../../../tl/index.js'
import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'

import { describe, expect, it, vi } from 'vitest'

import { PeersIndex } from '../../types/peers/peers-index.js'
import { RawUpdateInfo } from '../../updates/types.js'
import { createStreamingDraft } from './create-streaming-draft.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})

function emitStopDraft(client: StubTelegramClient, randomId: Long) {
  const update: tl.RawUpdateUserTyping = {
    _: 'updateUserTyping',
    userId: stubUser.id,
    action: { _: 'sendMessageStopDraftAction', randomId },
  }
  client.onRawUpdate.emit(new RawUpdateInfo(update, new PeersIndex()))
}

describe('createStreamingDraft', () => {
  it('should stop sending drafts once the user stops the draft', async () => {
    const client = new StubTelegramClient()
    await client.registerPeers(stubUser)

    const call = vi.spyOn(client, 'call').mockResolvedValue(true as never)

    const listeners = client.onRawUpdate.length
    const draft = await createStreamingDraft(client, stubUser.id, { canStop: true, keepOnStop: true, mode: 'append' })
    expect(client.onRawUpdate.length).toBe(listeners + 1)

    await draft.send('hello')
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({
        _: 'sendMessageTextDraftAction',
        canStop: true,
        keepOnStop: true,
        randomId: draft.randomId,
      }),
    }), expect.anything())

    emitStopDraft(client, draft.randomId.add(1))
    expect(draft.signal?.aborted).toBe(false)

    emitStopDraft(client, draft.randomId)
    expect(draft.signal?.aborted).toBe(true)
    expect(client.onRawUpdate.length).toBe(listeners)

    await draft.send(' world')
    expect(call).toHaveBeenCalledTimes(1)
    expect(draft.finalText.text).toBe('hello')
  })

  it('should not send a draft if stopped while normalizing', async () => {
    const client = new StubTelegramClient()
    await client.registerPeers(stubUser)

    const call = vi.spyOn(client, 'call').mockResolvedValue(true as never)

    const draft = await createStreamingDraft(client, stubUser.id, { canStop: true })

    const promise = draft.send('hello')
    emitStopDraft(client, draft.randomId)
    await promise

    expect(call).not.toHaveBeenCalled()
  })

  it('should share a single update listener between drafts', async () => {
    const client = new StubTelegramClient()
    await client.registerPeers(stubUser)

    const listeners = client.onRawUpdate.length
    const draft1 = await createStreamingDraft(client, stubUser.id, { canStop: true })
    const draft2 = await createStreamingDraft(client, stubUser.id, { canStop: true })
    expect(client.onRawUpdate.length).toBe(listeners + 1)

    emitStopDraft(client, draft1.randomId)
    expect(draft1.signal?.aborted).toBe(true)
    expect(draft2.signal?.aborted).toBe(false)
    expect(client.onRawUpdate.length).toBe(listeners + 1)

    draft1.dispose()
    expect(client.onRawUpdate.length).toBe(listeners + 1)

    draft2.dispose()
    expect(client.onRawUpdate.length).toBe(listeners)

    const draft3 = await createStreamingDraft(client, stubUser.id, { canStop: true })
    expect(client.onRawUpdate.length).toBe(listeners + 1)

    emitStopDraft(client, draft3.randomId)
    expect(draft3.signal?.aborted).toBe(true)
    expect(client.onRawUpdate.length).toBe(listeners)
  })

  it('should not listen for stop unless canStop is passed', async () => {
    const client = new StubTelegramClient()
    await client.registerPeers(stubUser)

    const listeners = client.onRawUpdate.length
    const draft = await createStreamingDraft(client, stubUser.id)

    expect(draft.signal).toBeUndefined()
    expect(client.onRawUpdate.length).toBe(listeners)
  })
})
