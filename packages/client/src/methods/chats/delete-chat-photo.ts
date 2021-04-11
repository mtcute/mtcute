import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    MtCuteInvalidPeerTypeError,
} from '../../types'
import { normalizeToInputChannel, normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Delete a chat photo
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function deleteChatPhoto(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<void> {
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    if (!(chat._ === 'inputPeerChat' || chat._ === 'inputPeerChannel'))
        throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')

    if (chat._ === 'inputPeerChat') {
        await this.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo: { _: 'inputChatPhotoEmpty' }
        })
    } else {
        await this.call({
            _: 'channels.editPhoto',
            channel: normalizeToInputChannel(chat)!,
            photo: { _: 'inputChatPhotoEmpty' }
        })
    }
}
