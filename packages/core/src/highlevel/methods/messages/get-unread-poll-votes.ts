import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginated, InputPeerLike } from '../../types/index.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { Message, PeersIndex } from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get messages containing polls with unread votes in a chat
 *
 * @param chatId  Chat ID
 */
export async function getUnreadPollVotes(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: {
    /** If passed, only polls in this thread (topic) will be returned */
    threadId?: number

    /**
     * Offset message ID. Only messages earlier than this ID will be returned.
     *
     * @default  `0` (starting from the latest message)
     */
    offset?: number

    /**
     * Additional offset from {@link offset}, in resulting messages
     *
     * @default  `0`
     */
    addOffset?: number

    /**
     * Minimum message ID to return
     *
     * @default  `0` (disabled)
     */
    minId?: number

    /**
     * Maximum message ID to return
     *
     * @default  `0` (disabled)
     */
    maxId?: number

    /**
     * Maximum number of messages to return
     *
     * @default  100
     */
    limit?: number
  },
): Promise<ArrayPaginated<Message, number>> {
  const { threadId, offset = 0, addOffset = 0, minId = 0, maxId = 0, limit = 100 } = params ?? {}

  const res = await client.call({
    _: 'messages.getUnreadPollVotes',
    peer: await resolvePeer(client, chatId),
    topMsgId: threadId,
    offsetId: offset,
    addOffset,
    limit,
    minId,
    maxId,
  })

  assertTypeIsNot(res, 'messages.messagesNotModified')

  const peers = PeersIndex.from(res)
  const msgs = res.messages.filter(msg => msg._ !== 'messageEmpty').map(msg => new Message(msg, peers))

  const last = msgs[msgs.length - 1]

  return makeArrayPaginated(msgs, (res as tl.messages.RawMessagesSlice).count ?? msgs.length, last?.id)
}
