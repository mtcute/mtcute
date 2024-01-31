import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerChat, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @alias=unrestrictChatMember
/**
 * Unban a user/channel from a supergroup or a channel,
 * or remove any restrictions that they have.
 * Unbanning does not add the user back to the chat, this
 * just allows the user to join the chat again, if they want.
 *
 * This method acts as a no-op in case a legacy group is passed.
 */
export async function unbanChatMember(
    client: ITelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User/channel ID who should be unbanned */
        participantId: InputPeerLike
    },
): Promise<void> {
    const { chatId, participantId } = params
    const chat = await resolvePeer(client, chatId)
    const peer = await resolvePeer(client, participantId)

    if (isInputPeerChannel(chat)) {
        const res = await client.call({
            _: 'channels.editBanned',
            channel: toInputChannel(chat),
            participant: peer,
            bannedRights: {
                _: 'chatBannedRights',
                untilDate: 0,
            },
        })

        client.handleClientUpdate(res)
    } else if (isInputPeerChat(chat)) {
        // no-op //
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
