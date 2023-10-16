import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Increment views of one or more stories.
 *
 * This should be used for pinned stories, as they can't
 * be marked as read when the user sees them ({@link Story#isActive} == false)
 *
 * @param peerId  Peer ID whose stories to mark as read
 * @param ids  ID(s) of the stories to increment views of (max 200)
 */
export async function incrementStoriesViews(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<boolean> {
    return client.call({
        _: 'stories.incrementStoryViews',
        peer: await resolvePeer(client, peerId),
        id: Array.isArray(ids) ? ids : [ids],
    })
}
