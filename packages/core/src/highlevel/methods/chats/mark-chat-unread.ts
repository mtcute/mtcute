import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Mark a chat as unread
 *
 * @param chatId  Chat ID
 */
export async function markChatUnread(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: {
    /**
     * For saved messages and monoforums (channel direct messages),
     * peer identifying the topic to mark as unread
     */
    topicPeer?: InputPeerLike
  },
): Promise<void> {
  const peer = await resolvePeer(client, chatId)
  const topicPeer = params?.topicPeer ? await resolvePeer(client, params.topicPeer) : undefined

  const r = await client.call({
    _: 'messages.markDialogUnread',
    peer: {
      _: 'inputDialogPeer',
      peer: topicPeer ?? peer,
    },
    parentPeer: topicPeer ? peer : undefined,
    unread: true,
  })

  assertTrue('messages.markDialogUnread', r)
}
