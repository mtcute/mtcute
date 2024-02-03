import { ITelegramClient } from '../../client.types.js'
import { normalizeInputMessageId, normalizeInputReaction, PeerReaction } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getReactionUsers } from './get-reaction-users.js'

/**
 * Iterate over users who have reacted to the message.
 *
 * Wrapper over {@link getReactionUsers}.
 *
 * @param chatId  Chat ID
 * @param messageId  Message ID
 * @param params
 */
export async function* iterReactionUsers(
    client: ITelegramClient,
    params: Parameters<typeof getReactionUsers>[1] & {
        /**
         * Limit the number of events returned.
         *
         * @default  `Infinity`, i.e. all events are returned
         */
        limit?: number

        /**
         * Chunk size, usually not needed.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<PeerReaction> {
    const { chatId, message } = normalizeInputMessageId(params)
    const peer = await resolvePeer(client, chatId)

    const { limit = Infinity, chunkSize = 100 } = params

    let current = 0
    let { offset } = params

    const reaction = normalizeInputReaction(params.emoji)

    for (;;) {
        const res = await getReactionUsers(client, {
            chatId: peer,
            message,
            emoji: reaction,
            limit: Math.min(chunkSize, limit - current),
            offset,
        })

        offset = res.next

        for (const reaction of res) {
            yield reaction

            if (++current >= limit) break
        }
    }
}
