import { TelegramClient } from '../../client'
import { InputPeerLike, MtqtInvalidPeerTypeError } from '../../types'
import { isInputPeerChat } from '../../utils/peer-utils'

/**
 * Delete a legacy group chat for all members
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function deleteGroup(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<void> {
    const chat = await this.resolvePeer(chatId)
    if (!isInputPeerChat(chat))
        throw new MtqtInvalidPeerTypeError(chatId, 'chat')

    const res = await this.call({
        _: 'messages.deleteChatUser',
        revokeHistory: true,
        chatId: chat.chatId,
        userId: { _: 'inputUserSelf' },
    })
    this._handleUpdate(res)

    await this.call({
        _: 'messages.deleteChat',
        chatId: chat.chatId,
    })
}
