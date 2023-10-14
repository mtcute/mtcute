import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Fetches the menu button set for the given user.
 */
export async function getBotMenuButton(client: BaseTelegramClient, user: InputPeerLike): Promise<tl.TypeBotMenuButton> {
    return await client.call({
        _: 'bots.getBotMenuButton',
        userId: normalizeToInputUser(await resolvePeer(client, user), user),
    })
}
