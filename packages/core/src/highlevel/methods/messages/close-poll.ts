import type { ITelegramClient } from '../../client.types.js'

import type { InputMessageId, Poll } from '../../types/index.js'
import Long from 'long'
import { normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findPollInUpdate } from './find-poll-in-update.js'

/**
 * Close a poll sent by you.
 *
 * Once closed, poll can't be re-opened, and nobody
 * will be able to vote in it
 */
export async function closePoll(
  client: ITelegramClient,
  params: InputMessageId & {
    /**
     * Whether to dispatch the edit message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Poll> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.editMessage',
    peer: await resolvePeer(client, chatId),
    id: message,
    media: {
      _: 'inputMediaPoll',
      poll: {
        _: 'poll',
        id: Long.ZERO,
        closed: true,
        question: { _: 'textWithEntities', text: '', entities: [] },
        answers: [],
        hash: Long.ZERO,
      },
    },
  })

  return _findPollInUpdate(client, res, !params.shouldDispatch)
}
