import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from './resolve-peer.js'

/**
 * Block a user
 *
 * @param id  User ID, username or phone number
 */
export async function blockUser(client: BaseTelegramClient, id: InputPeerLike): Promise<void> {
    const r = await client.call({
        _: 'contacts.block',
        id: await resolvePeer(client, id),
    })

    assertTrue('contacts.block', r)
}
