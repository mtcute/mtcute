import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Set whether a chat has content protection (i.e. forwarding messages is disabled)
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether content protection should be enabled
 * @internal
 */
export async function toggleContentProtection(
    this: TelegramClient,
    chatId: InputPeerLike,
    enabled = false,
): Promise<void> {
    const res = await this.call({
        _: 'messages.toggleNoForwards',
        peer: await this.resolvePeer(chatId),
        enabled,
    })
    this._handleUpdate(res)
}
