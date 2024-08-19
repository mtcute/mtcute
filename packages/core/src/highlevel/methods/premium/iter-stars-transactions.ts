import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, StarsTransaction } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { getStarsTransactions } from './get-stars-transactions.js'

/**
 * Iterate over Telegram Stars transactions for a given peer.
 *
 * You can either pass `self` to get your own transactions,
 * or a chat/bot ID to get transactions of that peer.
 *
 * Wrapper over {@link getStarsTransactions}
 *
 * @param peerId  Peer ID
 * @param params  Additional parameters
 */
export async function* iterStarsTransactions(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<typeof getStarsTransactions>[2] & {
        /**
         * Total number of boosters to fetch
         *
         * @default  Infinity, i.e. fetch all boosters
         */
        limit?: number

        /**
         * Number of boosters to fetch per request
         * Usually you don't need to change this
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<StarsTransaction> {
    if (!params) params = {}
    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    const peer = await resolvePeer(client, peerId)

    for (;;) {
        const res = await getStarsTransactions(client, peer, {
            offset,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const transaction of res.transactions) {
            yield transaction

            if (++current >= limit) return
        }

        if (!res.transactionsNextOffset) return
        offset = res.transactionsNextOffset
    }
}
