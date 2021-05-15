import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Change chat description
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param description  New chat description, 0-255 characters
 * @internal
 */
export async function setChatDescription(
    this: TelegramClient,
    chatId: InputPeerLike,
    description: string
): Promise<void> {
    const chat = await this.resolvePeer(chatId)

    await this.call({
        _: 'messages.editChatAbout',
        peer: chat,
        about: description,
    })
}
