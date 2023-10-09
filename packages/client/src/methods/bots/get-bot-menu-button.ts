import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Fetches the menu button set for the given user.
 */
export async function getBotMenuButton(client: BaseTelegramClient, user: InputPeerLike): Promise<tl.TypeBotMenuButton> {
    return await client.call({
        _: 'bots.getBotMenuButton',
        userId: normalizeToInputUser(await resolvePeer(client, user), user),
    })
}
