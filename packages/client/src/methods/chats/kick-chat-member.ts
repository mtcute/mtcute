import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Kick a user from a chat.
 *
 * This effectively bans a user and immediately unbans them.
 *
 * @param chatId  Chat ID
 * @param userId  User ID
 * @internal
 */
export async function kickChatMember(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike
): Promise<void> {
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    const user = normalizeToInputPeer(await this.resolvePeer(userId))

    await this.banChatMember(chat, user)

    // not needed in case this is a legacy group
    if (isInputPeerChannel(chat)) {
        await this.unbanChatMember(chat, user)
    }
}
