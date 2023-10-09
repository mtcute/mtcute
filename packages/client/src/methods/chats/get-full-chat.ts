import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'

import { Chat, InputPeerLike } from '../../types'
import {
    INVITE_LINK_REGEX,
    isInputPeerChannel,
    isInputPeerChat,
    isInputPeerUser,
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get full information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 */
export async function getFullChat(client: BaseTelegramClient, chatId: InputPeerLike): Promise<Chat> {
    if (typeof chatId === 'string') {
        const m = chatId.match(INVITE_LINK_REGEX)

        if (m) {
            const res = await client.call({
                _: 'messages.checkChatInvite',
                hash: m[1],
            })

            if (res._ === 'chatInvite') {
                throw new MtArgumentError(`You haven't joined ${JSON.stringify(res.title)}`)
            }

            // we still need to fetch full chat info
            chatId = res.chat.id
        }
    }

    const peer = await resolvePeer(client, chatId)

    let res: tl.messages.TypeChatFull | tl.users.TypeUserFull
    if (isInputPeerChannel(peer)) {
        res = await client.call({
            _: 'channels.getFullChannel',
            channel: normalizeToInputChannel(peer),
        })
    } else if (isInputPeerUser(peer)) {
        res = await client.call({
            _: 'users.getFullUser',
            id: normalizeToInputUser(peer)!,
        })
    } else if (isInputPeerChat(peer)) {
        res = await client.call({
            _: 'messages.getFullChat',
            chatId: peer.chatId,
        })
    } else throw new Error('should not happen')

    return Chat._parseFull(res)
}
