import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChat } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete a legacy group chat for all members
 *
 * @param chatId  Chat ID
 */
export async function deleteGroup(client: ITelegramClient, chatId: InputPeerLike): Promise<void> {
    const chat = await resolvePeer(client, chatId)
    if (!isInputPeerChat(chat)) throw new MtInvalidPeerTypeError(chatId, 'chat')

    const res = await client.call({
        _: 'messages.deleteChatUser',
        revokeHistory: true,
        chatId: chat.chatId,
        userId: { _: 'inputUserSelf' },
    })
    client.handleClientUpdate(res)

    const r = await client.call({
        _: 'messages.deleteChat',
        chatId: chat.chatId,
    })

    assertTrue('messages.deleteChat', r)
}
