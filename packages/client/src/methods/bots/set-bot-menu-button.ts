import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { InputPeerLike, MtInvalidPeerTypeError } from "../../types";
import { normalizeToInputUser } from "../../utils/peer-utils";

/**
 * Sets a menu button for the given user.
 *
 * @internal
 */
export async function setBotMenuButton(
    this: TelegramClient,
    user: InputPeerLike,
    button: tl.TypeBotMenuButton
): Promise<void> {
    const userId = normalizeToInputUser(await this.resolvePeer(user))
    if (!userId) {
        throw new MtInvalidPeerTypeError(user, 'user')
    }

    await this.call({
        _: 'bots.setBotMenuButton',
        userId,
        button
    })
}
