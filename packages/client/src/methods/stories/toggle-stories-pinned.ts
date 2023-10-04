import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Toggle one or more stories pinned status
 *
 * @returns  IDs of stories that were toggled
 * @internal
 */
export async function toggleStoriesPinned(
    this: TelegramClient,
    params: {
        /**
         * Story ID(s) to toggle
         */
        ids: MaybeArray<number>

        /**
         * Whether to pin or unpin the story
         */
        pinned: boolean

        /**
         * Peer ID whose stories to toggle
         *
         * @default  `self`
         */
        peer?: InputPeerLike
    },
): Promise<number[]> {
    const { ids, pinned, peer = 'me' } = params

    return await this.call({
        _: 'stories.togglePinned',
        peer: await this.resolvePeer(peer),
        id: Array.isArray(ids) ? ids : [ids],
        pinned,
    })
}
