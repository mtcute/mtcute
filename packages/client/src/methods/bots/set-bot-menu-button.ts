import { BaseTelegramClient, tl } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Sets a menu button for the given user.
 */
export async function setBotMenuButton(
    client: BaseTelegramClient,
    user: InputPeerLike,
    button: tl.TypeBotMenuButton,
): Promise<void> {
    const r = await client.call({
        _: 'bots.setBotMenuButton',
        userId: toInputUser(await resolvePeer(client, user), user),
        button,
    })

    assertTrue('bots.setBotMenuButton', r)
}
