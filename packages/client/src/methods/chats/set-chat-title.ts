import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    MtCuteInvalidPeerTypeError,
} from '../../types'
import { normalizeToInputChannel, normalizeToInputPeer } from '../../utils/peer-utils'

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
    title: string
): Promise<void> {
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    if (!(chat._ === 'inputPeerChat' || chat._ === 'inputPeerChannel'))
        throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')

    let res
    if (chat._ === 'inputPeerChat') {
        res = await this.call({
            _: 'messages.editChatTitle',
            chatId: chat.chatId,
            title
        })
    } else {
        res = await this.call({
            _: 'channels.editTitle',
            channel: normalizeToInputChannel(chat)!,
            title
        })
    }
    this._handleUpdate(res)
}
