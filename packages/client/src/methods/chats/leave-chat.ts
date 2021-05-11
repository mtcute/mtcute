import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import { TelegramClient } from '../../client'
import {
    isInputPeerChannel, isInputPeerChat,
    normalizeToInputChannel,
    normalizeToInputPeer,
} from '../../utils/peer-utils'

/**
 * Leave a group chat, supergroup or channel
 *
 * @param chatId  Chat ID or username
 * @param clear  Whether to clear history after leaving (only for legacy group chats)
 * @internal
 */
export async function leaveChat(
    this: TelegramClient,
    chatId: InputPeerLike,
    clear = false
): Promise<void> {
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))

    if (isInputPeerChannel(chat)) {
        const res = await this.call({
            _: 'channels.leaveChannel',
            channel: normalizeToInputChannel(chat),
        })
        this._handleUpdate(res)
    } else if (isInputPeerChat(chat)) {
        const res = await this.call({
            _: 'messages.deleteChatUser',
            chatId: chat.chatId,
            userId: { _: 'inputUserSelf' },
        })
        this._handleUpdate(res)

        if (clear) {
            await this.deleteHistory(chat)
        }
    } else throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')
}
