import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { createDummyUpdate } from '../../updates/utils.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete communication history (for private chats and legacy groups)
 */
export async function deleteHistory(
    client: ITelegramClient,
    chat: InputPeerLike,
    params?: {
        /**
         * Deletion mode. Can be:
         * - `delete`: delete messages (only for yourself) AND the dialog itself
         * - `clear`: delete messages (only for yourself), but keep the dialog in the list
         * - `revoke`: delete messages for all users
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
        client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
    } else {
        client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
