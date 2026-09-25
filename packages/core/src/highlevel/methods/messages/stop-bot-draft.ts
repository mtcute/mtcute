import type Long from 'long'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Stop generation of a streaming draft by a bot
 * (only available if the bot allowed it, see {@link UserTypingUpdate.canStopDraft})
 *
 * @param chatId  Chat with the bot
 * @param draftId  ID of the draft to stop (see {@link UserTypingUpdate.draftId})
 */
export async function stopBotDraft(
  client: ITelegramClient,
  chatId: InputPeerLike,
  draftId: Long,
  params?: {
    /** For bot forum topics, ID of the topic */
    threadId?: number
  },
): Promise<void> {
  const r = await client.call({
    _: 'messages.setTyping',
    peer: await resolvePeer(client, chatId),
    action: { _: 'sendMessageStopDraftAction', randomId: draftId },
    topMsgId: params?.threadId,
  })

  assertTrue('messages.setTyping', r)
}
