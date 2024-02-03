import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { toInputChannel, toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Edit supergroup/channel admin rights of a user.
 */
export async function editAdminRights(
    client: ITelegramClient,
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

    const chat = toInputChannel(await resolvePeer(client, chatId), chatId)
    const user = toInputUser(await resolvePeer(client, userId), userId)

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

    client.handleClientUpdate(res)
}
