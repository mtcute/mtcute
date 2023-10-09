import { BaseTelegramClient } from '@mtcute/core'

import {
    ArrayPaginated,
    InputPeerLike,
    InputReaction,
    normalizeInputReaction,
    PeerReaction,
    PeersIndex,
} from '../../types'
import { makeArrayPaginated } from '../../utils'
import { resolvePeer } from '../users/resolve-peer'

// @exported
export type GetReactionUsersOffset = string

/**
 * Get users who have reacted to the message.
 *
 * @param chatId  Chat ID
 * @param messageId  Message ID
 * @param params
 */
export async function getReactionUsers(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    params?: {
        /**
         * Get only reactions with the specified emoji
         */
        emoji?: InputReaction

        /**
         * Limit the number of users returned.
         *
         * @default  100
         */
        limit?: number

        /**
         * Offset for pagination
         */
        offset?: GetReactionUsersOffset
    },
): Promise<ArrayPaginated<PeerReaction, GetReactionUsersOffset>> {
    if (!params) params = {}

    const { limit = 100, offset, emoji } = params

    const peer = await resolvePeer(client, chatId)

    const reaction = normalizeInputReaction(emoji)

    const res = await client.call({
        _: 'messages.getMessageReactionsList',
        peer,
        id: messageId,
        reaction,
        limit,
        offset,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.reactions.map((it) => new PeerReaction(it, peers)),
        res.count,
        res.nextOffset,
    )
}
