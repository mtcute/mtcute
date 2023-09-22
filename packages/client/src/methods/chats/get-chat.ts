import { MtArgumentError } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Chat, InputPeerLike } from '../../types'
import {
    INVITE_LINK_REGEX,
    isInputPeerChannel,
    isInputPeerChat,
    isInputPeerUser,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Get basic information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 * @internal
 */
export async function getChat(
    this: TelegramClient,
    chatId: InputPeerLike,
): Promise<Chat> {
    if (typeof chatId === 'string') {
        const m = chatId.match(INVITE_LINK_REGEX)

        if (m) {
            const res = await this.call({
                _: 'messages.checkChatInvite',
                hash: m[1],
            })

            if (res._ === 'chatInvite') {
                throw new MtArgumentError(
                    `You haven't joined ${JSON.stringify(res.title)}`,
                )
            }

            return new Chat(this, res.chat)
        }
    }

    const peer = await this.resolvePeer(chatId)

    let res: tl.TypeChat | tl.TypeUser
    if (isInputPeerChannel(peer)) {
        const r = await this.call({
            _: 'channels.getChannels',
            id: [normalizeToInputChannel(peer)],
        })
        res = r.chats[0]
    } else if (isInputPeerUser(peer)) {
        const r = await this.call({
            _: 'users.getUsers',
            id: [normalizeToInputUser(peer)],
        })
        res = r[0]
    } else if (isInputPeerChat(peer)) {
        const r = await this.call({
            _: 'messages.getChats',
            id: [peer.chatId],
        })
        res = r.chats[0]
    } else throw new Error('should not happen')

    return new Chat(this, res)
}
