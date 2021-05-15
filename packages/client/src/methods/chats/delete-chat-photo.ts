import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
} from '../../utils/peer-utils'

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
    const chat = await this.resolvePeer(chatId)

    let res
    if (isInputPeerChat(chat)) {
        res = await this.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo: { _: 'inputChatPhotoEmpty' },
        })
    } else if (isInputPeerChannel(chat)) {
        res = await this.call({
            _: 'channels.editPhoto',
            channel: normalizeToInputChannel(chat),
            photo: { _: 'inputChatPhotoEmpty' },
        })
    } else throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')

    this._handleUpdate(res)
}
