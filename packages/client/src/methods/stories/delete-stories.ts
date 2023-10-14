import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete a story
 *
 * @returns  IDs of stories that were removed
 */
export async function deleteStories(
    client: BaseTelegramClient,
    params: {
        /**
         * Story IDs to delete
         */
        ids: MaybeArray<number>

        /**
         * Peer ID whose stories to delete
         *
         * @default  `self`
         */
        peer?: InputPeerLike
    },
): Promise<number[]> {
    const { ids, peer = 'me' } = params

    return client.call({
        _: 'stories.deleteStories',
        peer: await resolvePeer(client, peer),
        id: Array.isArray(ids) ? ids : [ids],
    })
}
