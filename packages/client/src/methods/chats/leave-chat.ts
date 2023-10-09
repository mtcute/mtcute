import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { isInputPeerChannel, isInputPeerChat, normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'
import { deleteHistory } from './delete-history'

/**
 * Leave a group chat, supergroup or channel
 *
 * @param chatId  Chat ID or username
 */
export async function leaveChat(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Whether to clear history after leaving (only for legacy group chats)
         */
        clear?: boolean
    },
): Promise<void> {
    const chat = await resolvePeer(client, chatId)

    if (isInputPeerChannel(chat)) {
        const res = await client.call({
            _: 'channels.leaveChannel',
            channel: normalizeToInputChannel(chat),
        })
        client.network.handleUpdate(res)
    } else if (isInputPeerChat(chat)) {
        const res = await client.call({
            _: 'messages.deleteChatUser',
            chatId: chat.chatId,
            userId: { _: 'inputUserSelf' },
        })
        client.network.handleUpdate(res)

        if (params?.clear) {
            await deleteHistory(client, chat)
        }
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
