import { MaybeArray } from '../../../types/utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
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
    client: ITelegramClient,
    peerId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<void> {
    const r = await client.call({
        _: 'stories.incrementStoryViews',
        peer: await resolvePeer(client, peerId),
        id: Array.isArray(ids) ? ids : [ids],
    })

    assertTrue('stories.incrementStoryViews', r)
}
