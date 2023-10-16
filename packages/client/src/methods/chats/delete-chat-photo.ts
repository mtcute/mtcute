import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerChat, normalizeToInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete a chat photo
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 */
export async function deleteChatPhoto(client: BaseTelegramClient, chatId: InputPeerLike): Promise<void> {
    const chat = await resolvePeer(client, chatId)

    let res
    if (isInputPeerChat(chat)) {
        res = await client.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo: { _: 'inputChatPhotoEmpty' },
        })
    } else if (isInputPeerChannel(chat)) {
        res = await client.call({
            _: 'channels.editPhoto',
            channel: normalizeToInputChannel(chat),
            photo: { _: 'inputChatPhotoEmpty' },
        })
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')

    client.network.handleUpdate(res)
}
