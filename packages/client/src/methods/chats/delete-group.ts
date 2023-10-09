import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { isInputPeerChat } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Delete a legacy group chat for all members
 *
 * @param chatId  Chat ID
 */
export async function deleteGroup(client: BaseTelegramClient, chatId: InputPeerLike): Promise<void> {
    const chat = await resolvePeer(client, chatId)
    if (!isInputPeerChat(chat)) throw new MtInvalidPeerTypeError(chatId, 'chat')

    const res = await client.call({
        _: 'messages.deleteChatUser',
        revokeHistory: true,
        chatId: chat.chatId,
        userId: { _: 'inputUserSelf' },
    })
    client.network.handleUpdate(res)

    await client.call({
        _: 'messages.deleteChat',
        chatId: chat.chatId,
    })
}
