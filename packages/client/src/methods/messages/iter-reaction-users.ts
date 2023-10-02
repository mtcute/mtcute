import { TelegramClient } from '../../client'
import { InputPeerLike, normalizeInputReaction, PeerReaction } from '../../types'

/**
 * Iterate over users who have reacted to the message.
 *
 * Wrapper over {@link getReactionUsers}.
 *
 * @param chatId  Chat ID
 * @param messageId  Message ID
 * @param params
 * @internal
 */
export async function* iterReactionUsers(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    params?: Parameters<TelegramClient['getReactionUsers']>[2] & {
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
    if (!params) params = {}

    const peer = await this.resolvePeer(chatId)

    const { limit = Infinity, chunkSize = 100 } = params

    let current = 0
    let { offset } = params

    const reaction = normalizeInputReaction(params.emoji)

    for (;;) {
        const res = await this.getReactionUsers(peer, messageId, {
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
