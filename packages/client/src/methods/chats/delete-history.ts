import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { createDummyUpdate } from '../../utils/updates-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete communication history (for private chats and legacy groups)
 */
export async function deleteHistory(
    client: BaseTelegramClient,
    chat: InputPeerLike,
    params?: {
        /**
         * Deletion mode. Can be:
         * - `delete`: delete messages (only for yourself)
         * - `clear`: delete messages (only for yourself)
         * - `revoke`: delete messages for all users
         * - I'm not sure what's the difference between `delete` and `clear`,
         * but they are in fact different flags in TL object.
         *
         * @default  'delete'
         */
        mode: 'delete' | 'clear' | 'revoke'

        /**
         * Maximum ID of message to delete.
         *
         * @default  0, i.e. remove all messages
         */
        maxId?: number
    },
): Promise<void> {
    const { mode = 'delete', maxId = 0 } = params ?? {}

    const peer = await resolvePeer(client, chat)

    const res = await client.call({
        _: 'messages.deleteHistory',
        justClear: mode === 'clear',
        revoke: mode === 'revoke',
        peer,
        maxId,
    })

    if (isInputPeerChannel(peer)) {
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
    } else {
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
