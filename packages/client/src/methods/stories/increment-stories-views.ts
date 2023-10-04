import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Increment views of one or more stories.
 *
 * This should be used for pinned stories, as they can't
 * be marked as read when the user sees them ({@link Story#isActive} == false)
 *
 * @param peerId  Peer ID whose stories to mark as read
 * @param ids  ID(s) of the stories to increment views of (max 200)
 * @internal
 */
export async function incrementStoriesViews(
    this: TelegramClient,
    peerId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<boolean> {
    return this.call({
        _: 'stories.incrementStoryViews',
        peer: await this.resolvePeer(peerId),
        id: Array.isArray(ids) ? ids : [ids],
    })
}
