import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerChat, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { deleteHistory } from './delete-history.js'

/**
 * Leave a group chat, supergroup or channel
 *
 * @param chatId  Chat ID or username
 */
export async function leaveChat(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Whether to clear history after leaving (only for legacy group chats)
         */
        clear?: boolean
    },
): Promise<void> {
    const chat = await resolvePeer(client, chatId)

    if (isInputPeerChannel(chat)) {
        const res = await client.call({
            _: 'channels.leaveChannel',
            channel: toInputChannel(chat),
        })
        client.handleClientUpdate(res)
    } else if (isInputPeerChat(chat)) {
        const res = await client.call({
            _: 'messages.deleteChatUser',
            chatId: chat.chatId,
            userId: { _: 'inputUserSelf' },
        })
        client.handleClientUpdate(res)

        if (params?.clear) {
            await deleteHistory(client, chat)
        }
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
