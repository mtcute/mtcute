import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Message } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getHistory } from './get-history.js'

/**
 * Iterate over chat history. Wrapper over {@link getHistory}
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional fetch parameters
 */
export async function* iterHistory(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<typeof getHistory>[2] & {
        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  Infinity, i.e. all messages
         */
        limit?: number

        /**
         * Chunk size. Usually you shouldn't care about this.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Message> {
    if (!params) params = {}

    const { limit = Infinity, chunkSize = 100, minId = 0, maxId = 0, reverse = false } = params

    let { offset, addOffset = 0 } = params
    let current = 0

    // resolve peer once and pass an InputPeer afterwards
    const peer = await resolvePeer(client, chatId)

    for (;;) {
        const res = await getHistory(client, peer, {
            offset,
            addOffset,
            limit: Math.min(chunkSize, limit - current),
            maxId,
            minId,
            reverse,
        })

        for (const msg of res) {
            yield msg

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
        addOffset = 0
    }
}
