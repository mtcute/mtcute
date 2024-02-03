import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export type CanSendStoryResult = true | 'need_admin' | 'need_boosts'

/**
 * Check if the current user can post stories as a given peer
 *
 * @param peerId  Peer ID whose stories to fetch
 * @returns
 *   - `true` if the user can post stories
 *   - `"need_admin"` if the user is not an admin in the chat
 *   - `"need_boosts"` if the channel doesn't have enough boosts
 */
export async function canSendStory(client: ITelegramClient, peerId: InputPeerLike): Promise<CanSendStoryResult> {
    try {
        const res = await client.call({
            _: 'stories.canSendStory',
            peer: await resolvePeer(client, peerId),
        })
        if (!res) return 'need_admin'

        return true
    } catch (e) {
        if (tl.RpcError.is(e, 'CHAT_ADMIN_REQUIRED')) {
            return 'need_admin'
        }

        if (tl.RpcError.is(e, 'BOOSTS_REQUIRED')) {
            return 'need_boosts'
        }

        throw e
    }
}
