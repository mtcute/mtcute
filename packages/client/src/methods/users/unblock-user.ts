import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Unblock a user
 *
 * @param id  User ID, username or phone number
 * @internal
 */
export async function unblockUser(this: TelegramClient, id: InputPeerLike): Promise<void> {
    await this.call({
        _: 'contacts.unblock',
        id: await this.resolvePeer(id),
    })
}
