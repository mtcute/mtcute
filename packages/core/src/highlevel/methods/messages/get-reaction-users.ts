import { ITelegramClient } from '../../client.types.js'
import {
    ArrayPaginated,
    InputMessageId,
    InputReaction,
    normalizeInputMessageId,
    normalizeInputReaction,
    PeerReaction,
    PeersIndex,
} from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export type GetReactionUsersOffset = string

/**
 * Get users who have reacted to the message.
 *
 * @param params
 */
export async function getReactionUsers(
    client: ITelegramClient,
    params: InputMessageId & {
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
    const { limit = 100, offset, emoji } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const peer = await resolvePeer(client, chatId)

    const reaction = normalizeInputReaction(emoji)

    const res = await client.call({
        _: 'messages.getMessageReactionsList',
        peer,
        id: message,
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
