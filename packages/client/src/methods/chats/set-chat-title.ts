import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
} from '../../utils/peer-utils'

/**
 * Change chat title
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param title  New chat title, 1-255 characters
 * @internal
 */
export async function setChatTitle(
    this: TelegramClient,
    chatId: InputPeerLike,
    title: string,
): Promise<void> {
    const chat = await this.resolvePeer(chatId)

    let res
    if (isInputPeerChat(chat)) {
        res = await this.call({
            _: 'messages.editChatTitle',
            chatId: chat.chatId,
            title,
        })
    } else if (isInputPeerChannel(chat)) {
        res = await this.call({
            _: 'channels.editTitle',
            channel: normalizeToInputChannel(chat),
            title,
        })
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')

    this._handleUpdate(res)
}
