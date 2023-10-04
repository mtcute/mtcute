import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Generate a link to a story.
 *
 * Basically the link format is `t.me/<username>/s/<story_id>`,
 * and if the user doesn't have a username, `USER_PUBLIC_MISSING` is thrown.
 *
 * I have no idea why is this an RPC call, but whatever
 *
 * @internal
 */
export async function getStoryLink(this: TelegramClient, peerId: InputPeerLike, storyId: number): Promise<string> {
    return this.call({
        _: 'stories.exportStoryLink',
        peer: await this.resolvePeer(peerId),
        id: storyId,
    }).then((r) => r.link)
}
