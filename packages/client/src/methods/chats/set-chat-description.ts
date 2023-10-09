import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Change chat description
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param description  New chat description, 0-255 characters
 */
export async function setChatDescription(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    description: string,
): Promise<void> {
    const chat = await resolvePeer(client, chatId)

    await client.call({
        _: 'messages.editChatAbout',
        peer: chat,
        about: description,
    })
}
