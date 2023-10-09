import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Generate a link to a story.
 *
 * Basically the link format is `t.me/<username>/s/<story_id>`,
 * and if the user doesn't have a username, `USER_PUBLIC_MISSING` is thrown.
 *
 * I have no idea why is this an RPC call, but whatever
 */
export async function getStoryLink(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyId: number,
): Promise<string> {
    return client
        .call({
            _: 'stories.exportStoryLink',
            peer: await resolvePeer(client, peerId),
            id: storyId,
        })
        .then((r) => r.link)
}
