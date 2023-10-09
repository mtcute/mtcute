import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Toggle whether peer's stories are archived (hidden) or not.
 *
 * This **does not** archive the chat with that peer, only stories.
 */
export async function togglePeerStoriesArchived(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    archived: boolean,
): Promise<void> {
    await client.call({
        _: 'stories.togglePeerStoriesHidden',
        peer: await resolvePeer(client, peerId),
        hidden: archived,
    })
}
