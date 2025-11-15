import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { ForumTopic, InputPeerLike, Message } from '../../types/index.js'
import Long from 'long'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Modify a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @returns  Service message about the modification
 */
export async function editForumTopic(
  client: ITelegramClient,
  params: {
    /** Chat ID or username */
    chatId: InputPeerLike

    /** ID of the topic (i.e. its top message ID) */
    topicId: number | ForumTopic

    /**
     * New topic title
     */
    title?: string

    /**
     * New icon of the topic.
     *
     * Can be a custom emoji ID, or `null` to remove the icon
     * and use static color instead
     */
    icon?: tl.Long | null

    /**
     * Whether to dispatch the returned service message (if any)
     * to the client's update handler.
     */
    shouldDispatch?: true

    /** Whether to (un)close the topic */
    closed?: boolean

    /** Whether to (un)hide the topic */
    hidden?: boolean
  },
): Promise<Message> {
  const { chatId, topicId, title, icon, shouldDispatch, closed, hidden } = params

  const res = await client.call({
    _: 'messages.editForumTopic',
    peer: await resolvePeer(client, chatId),
    topicId: typeof topicId === 'number' ? topicId : topicId.id,
    title,
    iconEmojiId: icon ? icon ?? Long.ZERO : undefined,
    closed,
    hidden,
  })

  return _findMessageInUpdate(client, res, false, shouldDispatch)
}
