import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Delete a story
 *
 * @returns  IDs of stories that were removed
 * @internal
 */
export async function deleteStories(
    this: TelegramClient,
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

    return this.call({
        _: 'stories.deleteStories',
        peer: await this.resolvePeer(peer),
        id: Array.isArray(ids) ? ids : [ids],
    })
}
