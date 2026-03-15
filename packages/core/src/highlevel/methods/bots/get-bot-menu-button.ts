import type { tl } from '../../../tl/index.js'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Fetches the menu button set for the given user.
 */
export async function getBotMenuButton(client: ITelegramClient, user: InputPeerLike): Promise<tl.TypeBotMenuButton> {
  return client.call({
    _: 'bots.getBotMenuButton',
    userId: await resolveUser(client, user),
  })
}
