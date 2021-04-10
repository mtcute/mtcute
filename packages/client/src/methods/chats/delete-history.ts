import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

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
    await this.call({
        _: 'messages.deleteHistory',
        justClear: mode === 'clear',
        revoke: mode === 'revoke',
        peer: normalizeToInputPeer(await this.resolvePeer(chat)),
        maxId
    })
}
