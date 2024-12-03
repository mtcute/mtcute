import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Sets a menu button for the given user.
 */
export async function setBotMenuButton(
    client: ITelegramClient,
    user: InputPeerLike,
    button: tl.TypeBotMenuButton,
): Promise<void> {
    const r = await client.call({
        _: 'bots.setBotMenuButton',
        userId: await resolveUser(client, user),
        button,
    })

    assertTrue('bots.setBotMenuButton', r)
}
