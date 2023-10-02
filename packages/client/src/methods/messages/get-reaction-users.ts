import { TelegramClient } from '../../client'
import {
    ArrayPaginated,
    InputPeerLike,
    InputReaction,
    normalizeInputReaction,
    PeerReaction,
    PeersIndex,
} from '../../types'
import { makeArrayPaginated } from '../../utils'

// @exported
export type GetReactionUsersOffset = string

/**
 * Get users who have reacted to the message.
 *
 * @param chatId  Chat ID
 * @param messageId  Message ID
 * @param params
 * @internal
 */
export async function getReactionUsers(
    this: TelegramClient,
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

    const peer = await this.resolvePeer(chatId)

    const reaction = normalizeInputReaction(emoji)

    const res = await this.call({
        _: 'messages.getMessageReactionsList',
        peer,
        id: messageId,
        reaction,
        limit,
        offset,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.reactions.map((it) => new PeerReaction(this, it, peers)),
        res.count,
        res.nextOffset,
    )
}
