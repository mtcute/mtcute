import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Mark a chat as unread
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function markChatUnread(this: TelegramClient, chatId: InputPeerLike): Promise<void> {
    await this.call({
        _: 'messages.markDialogUnread',
        peer: {
            _: 'inputDialogPeer',
            peer: await this.resolvePeer(chatId),
        },
        unread: true,
    })
}
