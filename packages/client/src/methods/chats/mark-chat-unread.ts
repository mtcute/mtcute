import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Mark a chat as unread
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function markChatUnread(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<void> {
    await this.call({
        _: 'messages.markDialogUnread',
        peer: {
            _: 'inputDialogPeer',
            peer: normalizeToInputPeer(await this.resolvePeer(chatId)),
        },
        unread: true
    })
}
