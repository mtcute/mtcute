import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel, normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Edit supergroup/channel admin rights of a user.
 *
 * @internal
 */
export async function editAdminRights(
    this: TelegramClient,
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

    const chat = normalizeToInputChannel(await this.resolvePeer(chatId), chatId)
    const user = normalizeToInputUser(await this.resolvePeer(userId), userId)

    const res = await this.call({
        _: 'channels.editAdmin',
        channel: chat,
        userId: user,
        adminRights: {
            _: 'chatAdminRights',
            ...rights,
        },
        rank,
    })

    this._handleUpdate(res)
}
