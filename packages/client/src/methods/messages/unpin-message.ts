import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Unpin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 *
 * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
 * @param messageId  Message ID
 * @internal
 */
export async function unpinMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
): Promise<void> {
    await this.call({
        _: 'messages.updatePinnedMessage',
        peer: normalizeToInputPeer(await this.resolvePeer(chatId)),
        id: messageId,
        unpin: true
    })
}