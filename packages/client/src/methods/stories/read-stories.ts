import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Mark all stories up to a given ID as read
 *
 * This should only be used for "active" stories ({@link Story#isActive} == false)
 *
 * @param peerId  Peer ID whose stories to mark as read
 * @returns  IDs of the stores that were marked as read
 * @internal
 */
export async function readStories(this: TelegramClient, peerId: InputPeerLike, maxId: number): Promise<number[]> {
    return this.call({
        _: 'stories.readStories',
        peer: await this.resolvePeer(peerId),
        maxId,
    })
}
