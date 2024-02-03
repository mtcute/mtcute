import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerUser, toInputChannel, toInputUser } from '../../utils/index.js'
import { isSelfPeer } from '../auth/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Reorder usernames
 *
 * @param peerId  Bot, channel or "me"/"self"
 */
export async function reorderUsernames(
    client: ITelegramClient,
    peerId: InputPeerLike,
    order: string[],
): Promise<void> {
    const peer = await resolvePeer(client, peerId)

    if (isInputPeerUser(peer)) {
        // either a bot or self

        if (isSelfPeer(client, peer)) {
            // self
            const r = await client.call({
                _: 'account.reorderUsernames',
                order,
            })

            assertTrue('account.reorderUsernames', r)

            return
        }

        // bot
        const r = await client.call({
            _: 'bots.reorderUsernames',
            bot: toInputUser(peer, peerId),
            order,
        })

        assertTrue('bots.reorderUsernames', r)
    } else if (isInputPeerChannel(peer)) {
        const r = await client.call({
            _: 'channels.reorderUsernames',
            channel: toInputChannel(peer, peerId),
            order,
        })

        assertTrue('channels.reorderUsernames', r)
    }
}
