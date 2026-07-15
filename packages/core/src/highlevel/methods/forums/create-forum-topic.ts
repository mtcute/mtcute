import type { tl } from '../../../tl/index.js'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Message } from '../../types/index.js'
import { randomLong } from '../../../utils/long-utils.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Create a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * > **Note**: for bots in private chats with "threaded mode" enabled,
 * > message IDs are separate for each side of the chat, while the
 * > canonical topic ID is always issued in the *user's* ID space.
 * > The `.id` of the returned service message is in the *bot's* ID space,
 * > and is **not** a valid topic ID — use `.replyToMessage.threadId` instead,
 * > which is what all other methods (as well as Bot API's `message_thread_id`) expect.
 *
 * @returns  Service message for the created topic
 */
export async function createForumTopic(
  client: ITelegramClient,
  params: {
    /** Chat ID or username */
    chatId: InputPeerLike

    /**
     * Topic title
     */
    title: string

    /**
     * Icon of the topic.
     *
     * Can be a number (color in RGB, see {@link ForumTopic} static members for allowed values)
     * or a custom emoji ID.
     *
     * Icon color can't be changed after the topic is created.
     */
    icon?: number | tl.Long

    /**
     * Send as a specific channel
     */
    sendAs?: InputPeerLike

    /**
     * Whether to dispatch the returned service message (if any)
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message> {
  const { chatId, title, icon, sendAs, shouldDispatch } = params

  const res = await client.call({
    _: 'messages.createForumTopic',
    peer: await resolvePeer(client, chatId),
    title,
    iconColor: typeof icon === 'number' ? icon : undefined,
    iconEmojiId: typeof icon !== 'number' ? icon : undefined,
    sendAs: sendAs ? await resolvePeer(client, sendAs) : undefined,
    randomId: randomLong(),
  })

  return _findMessageInUpdate(client, res, false, !shouldDispatch)
}
