import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Change supergroup/channel username
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or current username
 * @param username  New username, or `null` to remove
 * @internal
 */
export async function setChatUsername(
    this: TelegramClient,
    chatId: InputPeerLike,
    username: string | null,
): Promise<void> {
    await this.call({
        _: 'channels.updateUsername',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        username: username || '',
    })
}
