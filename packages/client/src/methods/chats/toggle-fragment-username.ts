import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { isInputPeerChannel, isInputPeerUser, normalizeToInputChannel, normalizeToInputUser } from '../../utils'
import { getAuthState } from '../auth/_state'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Toggle a collectible (Fragment) username
 *
 * > **Note**: non-collectible usernames must still be changed
 * > using {@link setUsername}/{@link setChatUsername}
 */
export async function toggleFragmentUsername(
    client: BaseTelegramClient,
    params: {
        /** Peer ID whose username to toggle */
        peerId: InputPeerLike

        /**
         * Username to toggle
         */
        username: string

        /**
         * Whether to enable or disable the username
         */
        active: boolean
    },
): Promise<void> {
    const { peerId, username, active } = params

    const peer = await resolvePeer(client, peerId)

    if (isInputPeerUser(peer)) {
        // either a bot or self

        if (peer._ === 'inputPeerSelf' || peer.userId === getAuthState(client).userId) {
            // self
            await client.call({
                _: 'account.toggleUsername',
                username,
                active,
            })

            return
        }

        // bot
        await client.call({
            _: 'bots.toggleUsername',
            bot: normalizeToInputUser(peer, peerId),
            username,
            active,
        })
    } else if (isInputPeerChannel(peer)) {
        await client.call({
            _: 'channels.toggleUsername',
            channel: normalizeToInputChannel(peer, peerId),
            username,
            active,
        })
    }
}
