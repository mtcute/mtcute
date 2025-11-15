import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Mark a chat as unread
 *
 * @param chatId  Chat ID
 */
export async function markChatUnread(client: ITelegramClient, chatId: InputPeerLike): Promise<void> {
  const r = await client.call({
    _: 'messages.markDialogUnread',
    peer: {
      _: 'inputDialogPeer',
      peer: await resolvePeer(client, chatId),
    },
    unread: true,
  })

  assertTrue('messages.markDialogUnread', r)
}
