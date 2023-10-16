import { BaseTelegramClient, tl } from '@mtcute/core'

import { Chat, InputPeerLike, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export type CanApplyBoostResult =
    | { can: true; current?: Chat }
    | { can: false; reason: 'already_boosting' | 'need_premium' }
    | { can: false; reason: 'timeout'; until: Date }

/**
 * Check if the current user can apply boost to a given channel
 *
 * @param peerId  Peer ID whose stories to fetch
 * @returns
 *   - `{ can: true }` if the user can apply boost
 *      - `.current` - {@link Chat} that the current user is currently boosting, if any
 *   - `{ can: false }` if the user can't apply boost
 *      - `.reason == "already_boosting"` if the user is already boosting this channel
 *      - `.reason == "need_premium"` if the user needs Premium to boost this channel
 *      - `.reason == "timeout"` if the user has recently boosted a channel and needs to wait
 *        (`.until` contains the date until which the user needs to wait)
 */
export async function canApplyBoost(client: BaseTelegramClient, peerId: InputPeerLike): Promise<CanApplyBoostResult> {
    try {
        const res = await client.call(
            {
                _: 'stories.canApplyBoost',
                peer: await resolvePeer(client, peerId),
            },
            { floodSleepThreshold: 0 },
        )

        if (res._ === 'stories.canApplyBoostOk') return { can: true }

        const peers = PeersIndex.from(res)
        const chat = new Chat(peers.get(res.currentBoost))

        return { can: true, current: chat }
    } catch (e) {
        if (!tl.RpcError.is(e)) throw e

        if (e.is('BOOST_NOT_MODIFIED')) {
            return { can: false, reason: 'already_boosting' }
        }

        if (e.is('PREMIUM_ACCOUNT_REQUIRED')) {
            return { can: false, reason: 'need_premium' }
        }

        if (e.is('FLOOD_WAIT_%d')) {
            return {
                can: false,
                reason: 'timeout',
                until: new Date(Date.now() + e.seconds * 1000),
            }
        }

        throw e
    }
}
