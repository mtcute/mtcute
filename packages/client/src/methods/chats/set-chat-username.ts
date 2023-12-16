import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

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
    const r = await client.call({
        _: 'channels.updateUsername',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        username: username || '',
    })

    assertTrue('channels.updateUsername', r)
}
