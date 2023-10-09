import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from './resolve-peer'

/**
 * Block a user
 *
 * @param id  User ID, username or phone number
 */
export async function blockUser(client: BaseTelegramClient, id: InputPeerLike): Promise<void> {
    await client.call({
        _: 'contacts.block',
        id: await resolvePeer(client, id),
    })
}
