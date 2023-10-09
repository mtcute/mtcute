import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Boost a given channel
 *
 * @param peerId  Peer ID to boost
 */
export async function applyBoost(client: BaseTelegramClient, peerId: InputPeerLike): Promise<void> {
    await client.call({
        _: 'stories.applyBoost',
        peer: await resolvePeer(client, peerId),
    })
}
