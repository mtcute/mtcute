import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { Chat, InputPeerLike, MtPeerNotFoundError } from '../../types/index.js'
import { INVITE_LINK_REGEX } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getRawPeerBatched } from './batched-queries.js'

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

    const res = await _getRawPeerBatched(client, peer)

    if (!res) throw new MtPeerNotFoundError(`Chat ${JSON.stringify(chatId)} was not found`)

    return new Chat(res)
}
