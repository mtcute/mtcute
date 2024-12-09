import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { MtArgumentError } from '../../../types/errors.js'
import { Chat, MtInvalidPeerTypeError, MtPeerNotFoundError } from '../../types/index.js'
import { INVITE_LINK_REGEX, isInputPeerChannel, isInputPeerChat, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { _getChannelsBatched, _getChatsBatched } from './batched-queries.js'

// @available=both
/**
 * Get basic information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 */
export async function getChat(client: ITelegramClient, chatId: InputPeerLike): Promise<Chat> {
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

            return new Chat(res.chat)
        }
    }

    const peer = await resolvePeer(client, chatId)

    let res
    if (isInputPeerChannel(peer)) {
        res = await _getChannelsBatched(client, toInputChannel(peer))
    } else if (isInputPeerChat(peer)) {
        res = await _getChatsBatched(client, peer.chatId)
    } else {
        throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
    }

    if (!res) throw new MtPeerNotFoundError(`Chat ${JSON.stringify(chatId)} was not found`)

    return new Chat(res)
}
