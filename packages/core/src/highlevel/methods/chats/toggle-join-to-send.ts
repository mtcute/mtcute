import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set whether a channel/supergroup has join-to-send setting enabled.
 *
 * This only affects discussion groups where users can send messages
 * without joining the group.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether join-to-send setting should be enabled
 */
export async function toggleJoinToSend(
    client: ITelegramClient,
    chatId: InputPeerLike,
    enabled = false,
): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleJoinToSend',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        enabled,
    })
    client.handleClientUpdate(res)
}
