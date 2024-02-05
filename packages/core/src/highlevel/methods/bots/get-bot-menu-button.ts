import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Fetches the menu button set for the given user.
 */
export async function getBotMenuButton(client: ITelegramClient, user: InputPeerLike): Promise<tl.TypeBotMenuButton> {
    return await client.call({
        _: 'bots.getBotMenuButton',
        userId: await resolveUser(client, user),
    })
}
