import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Change supergroup/channel username
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or current username
 * @param username  New username, or `null` to remove
 */
export async function setChatUsername(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    username: string | null,
): Promise<void> {
    await client.call({
        _: 'channels.updateUsername',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        username: username || '',
    })
}
