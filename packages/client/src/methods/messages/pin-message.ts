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
 * @internal
 */
export async function pinMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    params?: {
        /** Whether to send a notification (only for legacy groups and supergroups) */
        notify?: boolean
        /** Whether to pin for both sides (only for private chats) */
        bothSides?: boolean
    },
): Promise<void> {
    const { notify, bothSides } = params ?? {}

    const res = await this.call({
        _: 'messages.updatePinnedMessage',
        peer: await this.resolvePeer(chatId),
        id: messageId,
        silent: !notify,
        pmOneside: !bothSides,
    })

    this._handleUpdate(res)
}
