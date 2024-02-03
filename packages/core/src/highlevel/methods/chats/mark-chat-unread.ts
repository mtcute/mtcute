import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
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
