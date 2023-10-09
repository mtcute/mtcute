import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Sets a menu button for the given user.
 */
export async function setBotMenuButton(
    client: BaseTelegramClient,
    user: InputPeerLike,
    button: tl.TypeBotMenuButton,
): Promise<void> {
    await client.call({
        _: 'bots.setBotMenuButton',
        userId: normalizeToInputUser(await resolvePeer(client, user), user),
        button,
    })
}
