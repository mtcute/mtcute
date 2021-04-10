import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

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
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    if (chat._ !== 'inputPeerChat')
        throw new MtCuteInvalidPeerTypeError(chatId, 'chat')

    await this.call({
        _: 'messages.deleteChatUser',
        revokeHistory: true,
        chatId: chat.chatId,
        userId: { _: 'inputUserSelf' },
    })

    await this.call({
        _: 'messages.deleteChat',
        chatId: chat.chatId,
    })
}
