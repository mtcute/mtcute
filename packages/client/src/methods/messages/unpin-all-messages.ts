import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { createDummyUpdate } from '../../utils/updates-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Unpin all pinned messages in a chat.
 *
 * @param chatId  Chat or user ID
 */
export async function unpinAllMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * For forums - unpin only messages from the given topic
         */
        topicId?: number
    },
): Promise<void> {
    const { topicId } = params ?? {}

    const peer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.unpinAllMessages',
        peer,
        topMsgId: topicId,
    })

    if (isInputPeerChannel(peer)) {
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
    } else {
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
