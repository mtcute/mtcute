import { InputPeerLike } from '../../types'
import { TelegramClient } from '../../client'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Block a user
 *
 * @param id  User ID, its username or phone number
 * @returns  Whether the action was successful
 * @internal
 */
export async function blockUser(
    this: TelegramClient,
    id: InputPeerLike
): Promise<boolean> {
    return this.call({
        _: 'contacts.block',
        id: normalizeToInputPeer(await this.resolvePeer(id)),
    })
}
