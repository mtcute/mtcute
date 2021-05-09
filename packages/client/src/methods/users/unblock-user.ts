import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Unblock a user
 *
 * @param id  User ID, username or phone number
 * @internal
 */
export async function unblockUser(
    this: TelegramClient,
    id: InputPeerLike
): Promise<void> {
    await this.call({
        _: 'contacts.unblock',
        id: normalizeToInputPeer(await this.resolvePeer(id)),
    })
}
