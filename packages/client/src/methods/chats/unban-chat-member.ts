import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { isInputPeerChannel, isInputPeerChat, normalizeToInputChannel } from '../../utils/peer-utils'

// @alias=unrestrictChatMember
/**
 * Unban a user/channel from a supergroup or a channel,
 * or remove any restrictions that they have.
 * Unbanning does not add the user back to the chat, this
 * just allows the user to join the chat again, if they want.
 *
 * This method acts as a no-op in case a legacy group is passed.
 *
 * @internal
 */
export async function unbanChatMember(
    this: TelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User/channel ID who should be unbanned */
        participantId: InputPeerLike
    },
): Promise<void> {
    const { chatId, participantId } = params
    const chat = await this.resolvePeer(chatId)
    const peer = await this.resolvePeer(participantId)

    if (isInputPeerChannel(chat)) {
        const res = await this.call({
            _: 'channels.editBanned',
            channel: normalizeToInputChannel(chat),
            participant: peer,
            bannedRights: {
                _: 'chatBannedRights',
                untilDate: 0,
            },
        })

        this._handleUpdate(res)
    } else if (isInputPeerChat(chat)) {
        // no-op //
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
