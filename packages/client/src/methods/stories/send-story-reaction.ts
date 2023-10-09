import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, InputReaction, normalizeInputReaction } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Send (or remove) a reaction to a story
 */
export async function sendStoryReaction(
    client: BaseTelegramClient,
    params: {
        peerId: InputPeerLike
        storyId: number
        reaction: InputReaction
        /**
         * Whether to add this reaction to recently used
         */
        addToRecent?: boolean
    },
): Promise<void> {
    const { peerId, storyId, reaction, addToRecent } = params

    const res = await client.call({
        _: 'stories.sendReaction',
        peer: await resolvePeer(client, peerId),
        storyId,
        reaction: normalizeInputReaction(reaction),
        addToRecent,
    })

    client.network.handleUpdate(res, true)
}
