import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set whether a channel/supergroup has join requests enabled.
 *
 * > **Note**: this method only affects primary invite links.
 * > Additional invite links may exist with the opposite setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether join requests should be enabled
 */
export async function toggleJoinRequests(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    enabled = false,
): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleJoinRequest',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        enabled,
    })
    client.network.handleUpdate(res)
}
