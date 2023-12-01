import { BaseTelegramClient } from '@mtcute/core'

import { ArrayWithTotal, Chat, InputPeerLike } from '../../types/index.js'
import { makeArrayWithTotal } from '../../utils/misc-utils.js'
import { normalizeToInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Get channels that are similar to a given channel
 *
 * > **Note**: This method only returns the channels that the current user
 * > is not subscribed to. For non-premium users, this method will only return
 * > a few channels (with the total number of similar channels being specified in `.total`)
 * >
 * > Returns empty array in case there are no similar channels available.
 */
export async function getSimilarChannels(
    client: BaseTelegramClient,
    channel: InputPeerLike,
): Promise<ArrayWithTotal<Chat>> {
    const res = await client.call({
        _: 'channels.getChannelRecommendations',
        channel: normalizeToInputChannel(await resolvePeer(client, channel), channel),
    })

    const parsed = res.chats.map((chat) => new Chat(chat))

    switch (res._) {
        case 'messages.chatsSlice':
            return makeArrayWithTotal(parsed, res.count)
        case 'messages.chats':
            return makeArrayWithTotal(parsed, parsed.length)
    }
}
