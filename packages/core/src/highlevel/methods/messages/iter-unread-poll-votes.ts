import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Message } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { getUnreadPollVotes } from './get-unread-poll-votes.js'

/**
 * Iterate over messages containing polls with unread votes in a chat
 *
 * Iterable version of {@link getUnreadPollVotes}
 *
 * @param chatId  Chat ID
 */
export async function* iterUnreadPollVotes(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: Parameters<typeof getUnreadPollVotes>[2] & {
    /**
     * Limits the number of messages to be retrieved.
     *
     * @default  `Infinity`, i.e. all messages are returned
     */
    limit?: number

    /**
     * Chunk size, which will be passed as `limit` parameter
     * for `messages.getUnreadPollVotes`. Usually you shouldn't care about this.
     *
     * @default  `100`
     */
    chunkSize?: number
  },
): AsyncIterableIterator<Message> {
  const { limit = Infinity, chunkSize = 100, ...rest } = params ?? {}

  const peer = await resolvePeer(client, chatId)

  let { offset, addOffset } = rest
  let current = 0

  for (;;) {
    const res = await getUnreadPollVotes(client, peer, {
      ...rest,
      offset,
      addOffset,
      limit: Math.min(chunkSize, limit - current),
    })

    if (!res.length) break

    for (const msg of res) {
      yield msg

      if (++current >= limit) return
    }

    if (!res.next) break
    offset = res.next
    addOffset = undefined
  }
}
