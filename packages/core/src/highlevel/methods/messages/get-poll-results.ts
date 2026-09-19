import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'
import Long from 'long'
import { normalizeInputMessageId, Poll } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findPollInUpdate } from './find-poll-in-update.js'

/**
 * Get the latest results of a poll.
 *
 * If the message object is passed (or {@link poll} is set), the poll itself
 * will only be re-fetched if it has changed
 */
export async function getPollResults(
  client: ITelegramClient,
  params: InputMessageId & {
    /** The currently known version of the poll */
    poll?: Poll

    /**
     * Whether to dispatch the poll update
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Poll> {
  const { chatId, message } = normalizeInputMessageId(params)

  let knownPoll = params.poll
  if (!knownPoll && typeof params.message !== 'number' && params.message.media instanceof Poll) {
    knownPoll = params.message.media
  }

  const res = await client.call({
    _: 'messages.getPollResults',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    pollHash: knownPoll?.hash ?? Long.ZERO,
  })

  return _findPollInUpdate(client, res, !params.shouldDispatch, knownPoll)
}
