import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Pin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 *
 * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
 * @param messageId  Message ID
 * @param notify  Whether to send a notification (only for legacy groups and supergroups)
 * @param bothSides  Whether to pin for both sides (only for private chats)
 * @internal
 */
export async function pinMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    notify = false,
    bothSides = false
): Promise<void> {
    const res = await this.call({
        _: 'messages.updatePinnedMessage',
        peer: await this.resolvePeer(chatId),
        id: messageId,
        silent: !notify,
        pmOneside: !bothSides
    })

    this._handleUpdate(res)
}
