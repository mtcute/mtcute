import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Boost a given channel
 *
 * @param peerId  Peer ID to boost
 * @internal
 */
export async function applyBoost(this: TelegramClient, peerId: InputPeerLike): Promise<void> {
    await this.call({
        _: 'stories.applyBoost',
        peer: await this.resolvePeer(peerId),
    })
}
