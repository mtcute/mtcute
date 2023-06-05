import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Chat, InputPeerLike, MtArgumentError } from '../../types'
import {
    INVITE_LINK_REGEX,
    isInputPeerChannel,
    isInputPeerChat,
    isInputPeerUser,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Get full information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 * @internal
 */
export async function getFullChat(
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

            // we still need to fetch full chat info
            chatId = res.chat.id
        }
    }

    const peer = await this.resolvePeer(chatId)

    let res: tl.messages.TypeChatFull | tl.users.TypeUserFull
    if (isInputPeerChannel(peer)) {
        res = await this.call({
            _: 'channels.getFullChannel',
            channel: normalizeToInputChannel(peer),
        })
    } else if (isInputPeerUser(peer)) {
        res = await this.call({
            _: 'users.getFullUser',
            id: normalizeToInputUser(peer)!,
        })
    } else if (isInputPeerChat(peer)) {
        res = await this.call({
            _: 'messages.getFullChat',
            chatId: peer.chatId,
        })
    } else throw new Error('should not happen')

    return Chat._parseFull(this, res)
}
