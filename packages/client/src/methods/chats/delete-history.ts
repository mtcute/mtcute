import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from "../../utils/peer-utils";
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete communication history (for private chats
 * and legacy groups)
 *
 * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
 * @param mode
 *   Deletion mode. Can be:
 *   - `delete`: delete messages (only for yourself)
 *   - `clear`: delete messages (only for yourself)
 *   - `revoke`: delete messages for all users
 *   - I'm not sure what's the difference between `delete` and `clear`,
 *     but they are in fact different flags in TL object.
 * @param maxId  Maximum ID of message to delete. Defaults to 0 (remove all messages)
 * @internal
 */
export async function deleteHistory(
    this: TelegramClient,
    chat: InputPeerLike,
    mode: 'delete' | 'clear' | 'revoke' = 'delete',
    maxId = 0
): Promise<void> {
    const peer = await this.resolvePeer(chat)

    const res = await this.call({
        _: 'messages.deleteHistory',
        justClear: mode === 'clear',
        revoke: mode === 'revoke',
        peer,
        maxId,
    })

    if (isInputPeerChannel(peer)) {
        this._handleUpdate(
            createDummyUpdate(
                res.pts,
                res.ptsCount,
                peer.channelId
            )
        )
    } else {
        this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
