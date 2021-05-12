import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    Message,
    MtCuteInvalidPeerTypeError,
    MtCuteTypeAssertionError,
} from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
    normalizeToInputPeer,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Ban a user from a legacy group, a supergroup or a channel.
 * They will not be able to re-join the group on their own,
 * manual administrator's action is required.
 *
 * @param chatId  Chat ID
 * @param userId  User ID
 * @returns  Service message about removed user, if one was generated.
 * @internal
 */
export async function banChatMember(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike
): Promise<Message | null> {
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    const user = normalizeToInputPeer(await this.resolvePeer(userId))

    let res
    if (isInputPeerChannel(chat)) {
        res = await this.call({
            _: 'channels.editBanned',
            channel: normalizeToInputChannel(chat),
            participant: user,
            bannedRights: {
                _: 'chatBannedRights',
                // bans can't be temporary.
                untilDate: 0,
                viewMessages: true,
            },
        })
    } else if (isInputPeerChat(chat)) {
        const normUser = normalizeToInputUser(user)
        if (!normUser) throw new MtCuteInvalidPeerTypeError(userId, 'user')

        res = await this.call({
            _: 'messages.deleteChatUser',
            chatId: chat.chatId,
            userId: normUser,
        })
    } else throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')

    try {
        return this._findMessageInUpdate(res)
    } catch (e) {
        if (
            e instanceof MtCuteTypeAssertionError &&
            e.context === '_findInUpdate (@ .updates[*])'
        ) {
            // no service message
            return null
        }

        throw e
    }
}
