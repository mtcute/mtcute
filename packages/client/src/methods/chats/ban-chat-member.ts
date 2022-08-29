import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    Message,
    MtInvalidPeerTypeError,
    MtTypeAssertionError,
} from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
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
    const chat = await this.resolvePeer(chatId)
    const user = await this.resolvePeer(userId)

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
        res = await this.call({
            _: 'messages.deleteChatUser',
            chatId: chat.chatId,
            userId: normalizeToInputUser(user),
        })
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')

    try {
        return this._findMessageInUpdate(res)
    } catch (e) {
        if (
            e instanceof MtTypeAssertionError &&
            e.context === '_findInUpdate (@ .updates[*])'
        ) {
            // no service message
            return null
        }

        throw e
    }
}
