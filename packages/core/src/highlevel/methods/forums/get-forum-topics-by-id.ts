import type { MaybeArray } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { ForumTopic } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get forum topics by their IDs
 *
 * The returned array is aligned with the input IDs.
 * For topics that were deleted (or never existed),
 * `null` will be returned at that position.
 *
 * > **Note**: for bots in private chats with "threaded mode" enabled,
 * > only canonical (user-space) topic IDs are accepted —
 * > see the note at {@link createForumTopic}
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopicsById(
  client: ITelegramClient,
  chatId: InputPeerLike,
  ids: MaybeArray<number>,
): Promise<(ForumTopic | null)[]> {
  if (!Array.isArray(ids)) ids = [ids]

  const res = await client.call({
    _: 'messages.getForumTopicsByID',
    peer: await resolvePeer(client, chatId),
    topics: ids,
  })

  const index = new Map<number, ForumTopic>()

  for (const topic of ForumTopic.parseTlForumTopics(res)) {
    index.set(topic.id, topic)
  }

  return ids.map(id => index.get(id) ?? null)
}
