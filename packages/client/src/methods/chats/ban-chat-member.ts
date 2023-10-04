import { MtTypeAssertionError } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, Message, MtInvalidPeerTypeError } from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Ban a user/channel from a legacy group, a supergroup or a channel.
 * They will not be able to re-join the group on their own,
 * manual administrator's action will be required.
 *
 * When banning a channel, the user won't be able to use
 * any of their channels to post until the ban is lifted.
 *
 * @param chatId  Chat ID
 * @param peerId  User/Channel ID
 * @returns  Service message about removed user, if one was generated.
 * @internal
 */
export async function banChatMember(
    this: TelegramClient,
    chatId: InputPeerLike,
    peerId: InputPeerLike,
): Promise<Message | null> {
    const chat = await this.resolvePeer(chatId)
    const peer = await this.resolvePeer(peerId)

    let res
    if (isInputPeerChannel(chat)) {
        res = await this.call({
            _: 'channels.editBanned',
            channel: normalizeToInputChannel(chat),
            participant: peer,
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
            userId: normalizeToInputUser(peer),
        })
    } else throw new MtInvalidPeerTypeError(chatId, 'chat or channel')

    try {
        return this._findMessageInUpdate(res)
    } catch (e) {
        if (e instanceof MtTypeAssertionError && e.context === '_findInUpdate (@ .updates[*])') {
            // no service message
            return null
        }

        throw e
    }
}
