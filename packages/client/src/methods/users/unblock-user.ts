import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from './resolve-peer.js'

/**
 * Unblock a user
 *
 * @param id  User ID, username or phone number
 */
export async function unblockUser(client: BaseTelegramClient, id: InputPeerLike): Promise<void> {
    const r = await client.call({
        _: 'contacts.unblock',
        id: await resolvePeer(client, id),
    })

    assertTrue('contacts.unblock', r)
}
