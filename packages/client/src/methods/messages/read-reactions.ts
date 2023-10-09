import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { createDummyUpdate } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Mark all reactions in chat as read.
 *
 * @param chatId  Chat ID
 */
export async function readReactions(client: BaseTelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await client.call({
        _: 'messages.readReactions',
        peer: await resolvePeer(client, chatId),
    })
    client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
}
