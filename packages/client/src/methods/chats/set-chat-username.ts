import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
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
    username: string | null
): Promise<void> {
    const chat = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!chat) throw new MtCuteInvalidPeerTypeError(chatId, 'channel')

    await this.call({
        _: 'channels.updateUsername',
        channel: chat,
        username: username || '',
    })
}
