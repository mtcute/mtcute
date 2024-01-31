import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

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
        userId: toInputUser(await resolvePeer(client, user), user),
        button,
    })

    assertTrue('bots.setBotMenuButton', r)
}
