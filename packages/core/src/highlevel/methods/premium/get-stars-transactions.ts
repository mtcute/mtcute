import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { StarsStatus } from '../../types/premium/stars-status.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get Telegram Stars transactions for a given peer.
 *
 * You can either pass `self` to get your own transactions,
 * or a chat/bot ID to get transactions of that peer.
 *
 * @param peerId  Peer ID
 * @param params  Additional parameters
 */
export async function getStarsTransactions(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: {
        /**
         * If passed, only transactions of this direction will be returned
         */
        direction?: 'incoming' | 'outgoing'
        /**
         * Direction to sort transactions date by (default: desc)
         */
        sort?: 'asc' | 'desc'
        /**
         * If passed, will only return transactions related to  this subscription ID
         */
        subscriptionId?: string
        /** Pagination offset */
        offset?: string
        /** Whether to return transactions made in TON */
        ton?: boolean
        /**
         * Pagination limit
         *
         * @default  100
         */
        limit?: number
    },
): Promise<StarsStatus> {
    const { direction, sort, subscriptionId, offset = '', limit = 100, ton } = params ?? {}

    const res = await client.call({
        _: 'payments.getStarsTransactions',
        peer: await resolvePeer(client, peerId),
        offset,
        limit,
        outbound: direction === 'outgoing',
        inbound: direction === 'incoming',
        ascending: sort === 'asc',
        subscriptionId,
        ton,
    })

    return new StarsStatus(res)
}
