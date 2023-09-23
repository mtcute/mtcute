import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Block a user
 *
 * @param id  User ID, username or phone number
 * @internal
 */
export async function blockUser(this: TelegramClient, id: InputPeerLike): Promise<void> {
    await this.call({
        _: 'contacts.block',
        id: await this.resolvePeer(id),
    })
}
