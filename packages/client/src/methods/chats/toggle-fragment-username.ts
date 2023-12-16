import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { assertTrue, isInputPeerChannel, isInputPeerUser, toInputChannel, toInputUser } from '../../utils/index.js'
import { isSelfPeer } from '../auth/_state.js'
import { resolvePeer } from '../users/resolve-peer.js'

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

        if (isSelfPeer(client, peer)) {
            // self
            const r = await client.call({
                _: 'account.toggleUsername',
                username,
                active,
            })

            assertTrue('account.toggleUsername', r)

            return
        }

        // bot
        const r = await client.call({
            _: 'bots.toggleUsername',
            bot: toInputUser(peer, peerId),
            username,
            active,
        })

        assertTrue('bots.toggleUsername', r)
    } else if (isInputPeerChannel(peer)) {
        const r = await client.call({
            _: 'channels.toggleUsername',
            channel: toInputChannel(peer, peerId),
            username,
            active,
        })

        assertTrue('channels.toggleUsername', r)
    }
}
