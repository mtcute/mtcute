import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { isInputPeerChannel, isInputPeerChat, normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Leave a group chat, supergroup or channel
 *
 * @param chatId  Chat ID or username
 * @param clear  Whether to clear history after leaving (only for legacy group chats)
 * @internal
 */
export async function leaveChat(this: TelegramClient, chatId: InputPeerLike, clear = false): Promise<void> {
    const chat = await this.resolvePeer(chatId)

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
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
