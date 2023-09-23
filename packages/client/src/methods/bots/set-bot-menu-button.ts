import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Sets a menu button for the given user.
 *
 * @internal
 */
export async function setBotMenuButton(
    this: TelegramClient,
    user: InputPeerLike,
    button: tl.TypeBotMenuButton,
): Promise<void> {
    await this.call({
        _: 'bots.setBotMenuButton',
        userId: normalizeToInputUser(await this.resolvePeer(user), user),
        button,
    })
}
