import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

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
 * @internal
 */
export async function canSendStory(this: TelegramClient, peerId: InputPeerLike): Promise<CanSendStoryResult> {
    try {
        const res = await this.call({
            _: 'stories.canSendStory',
            peer: await this.resolvePeer(peerId),
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
