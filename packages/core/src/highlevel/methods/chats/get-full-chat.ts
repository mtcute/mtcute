import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { MtArgumentError } from '../../../types/errors.js'
import { FullChat, MtInvalidPeerTypeError } from '../../types/index.js'
import {
    INVITE_LINK_REGEX,
    isInputPeerChannel,
    isInputPeerChat,
    toInputChannel,
} from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=both
/**
 * Get full information about a chat.
 *
 * @param chatId  ID of the chat, its username or invite link
 * @throws MtArgumentError
 *   In case you are trying to get info about private chat that you haven't joined.
 *   Use {@link getChatPreview} instead.
 */
export async function getFullChat(client: ITelegramClient, chatId: InputPeerLike): Promise<FullChat> {
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

    let res: tl.messages.TypeChatFull
    if (isInputPeerChannel(peer)) {
        res = await client.call({
            _: 'channels.getFullChannel',
            channel: toInputChannel(peer),
        })
    } else if (isInputPeerChat(peer)) {
        res = await client.call({
            _: 'messages.getFullChat',
            chatId: peer.chatId,
        })
    } else {
        throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
    }

    return new FullChat(res)
}
