import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import {
    createUsersChatsIndex,
    isInputPeerChannel,
    isInputPeerChat,
    isInputPeerUser,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { assertTypeIs } from '../../utils/type-assertion'
import { tl } from '@mtcute/tl'
import { ChatMember } from '../../types'
import { UserNotParticipantError } from '@mtcute/tl/errors'

/**
 * Get information about a single chat member
 *
 * @param chatId  Chat ID or username
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @throws UserNotParticipantError  In case given user is not a participant of a given chat
 * @internal
 */
export async function getChatMember(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike
): Promise<ChatMember> {
    const user = await this.resolvePeer(userId)
    const chat = await this.resolvePeer(chatId)

    if (isInputPeerChat(chat)) {
        if (!isInputPeerUser(user))
            throw new MtCuteInvalidPeerTypeError(userId, 'user')

        const res = await this.call({
            _: 'messages.getFullChat',
            chatId: chat.chatId,
        })

        assertTypeIs(
            'getChatMember (@ messages.getFullChat)',
            res.fullChat,
            'chatFull'
        )

        const members =
            res.fullChat.participants._ === 'chatParticipantsForbidden'
                ? []
                : res.fullChat.participants.participants

        const { users } = createUsersChatsIndex(res)

        for (const m of members) {
            if (
                (user._ === 'inputPeerSelf' &&
                    (users[m.userId] as tl.RawUser).self) ||
                (user._ === 'inputPeerUser' && m.userId === user.userId)
            ) {
                return new ChatMember(this, m, users)
            }
        }

        throw new UserNotParticipantError()
    } else if (isInputPeerChannel(chat)) {
        const res = await this.call({
            _: 'channels.getParticipant',
            channel: normalizeToInputChannel(chat),
            participant: user,
        })

        const { users } = createUsersChatsIndex(res)

        return new ChatMember(this, res.participant, users)
    } else throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')
}
