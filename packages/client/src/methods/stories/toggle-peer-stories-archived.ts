import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Toggle whether peer's stories are archived (hidden) or not.
 *
 * This **does not** archive the chat with that peer, only stories.
 *
 * @internal
 */
export async function togglePeerStoriesArchived(
    this: TelegramClient,
    peerId: InputPeerLike,
    archived: boolean,
): Promise<void> {
    await this.call({
        _: 'stories.togglePeerStoriesHidden',
        peer: await this.resolvePeer(peerId),
        hidden: archived,
    })
}
