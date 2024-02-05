import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Change supergroup/channel username
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or current username
 * @param username  New username, or `null` to remove
 */
export async function setChatUsername(
    client: ITelegramClient,
    chatId: InputPeerLike,
    username: string | null,
): Promise<void> {
    const r = await client.call({
        _: 'channels.updateUsername',
        channel: await resolveChannel(client, chatId),
        username: username || '',
    })

    assertTrue('channels.updateUsername', r)
}
