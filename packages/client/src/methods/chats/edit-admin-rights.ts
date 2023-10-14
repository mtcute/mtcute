import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { normalizeToInputChannel, normalizeToInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Edit supergroup/channel admin rights of a user.
 */
export async function editAdminRights(
    client: BaseTelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User ID */
        userId: InputPeerLike
        /** New admin rights */
        rights: Omit<tl.RawChatAdminRights, '_'>
        /** Custom admin rank */
        rank?: string
    },
): Promise<void> {
    const { chatId, userId, rights, rank = '' } = params

    const chat = normalizeToInputChannel(await resolvePeer(client, chatId), chatId)
    const user = normalizeToInputUser(await resolvePeer(client, userId), userId)

    const res = await client.call({
        _: 'channels.editAdmin',
        channel: chat,
        userId: user,
        adminRights: {
            _: 'chatAdminRights',
            ...rights,
        },
        rank,
    })

    client.network.handleUpdate(res)
}
