import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'

import { resolvePeer } from './resolve-peer.js'

/**
 * Block a user
 *
 * @param id  User ID, username or phone number
 */
export async function blockUser(client: ITelegramClient, id: InputPeerLike): Promise<void> {
  const r = await client.call({
    _: 'contacts.block',
    id: await resolvePeer(client, id),
  })

  assertTrue('contacts.block', r)
}
