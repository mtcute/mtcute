import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

// @alias=deleteSupergroup
/**
 * Delete a channel or a supergroup
 *
 * @param chatId  Chat ID or username
 */
export async function deleteChannel(client: BaseTelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await client.call({
        _: 'channels.deleteChannel',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
    })
    client.network.handleUpdate(res)
}
