import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import { tl } from '@mtcute/tl'
import { normalizeToInputChannel, normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Edit supergroup/channel admin rights of a user.
 *
 * @param chatId  Chat ID
 * @param userId  User ID
 * @param rights  New admin rights
 * @param rank  Custom admin rank
 * @internal
 */
export async function editAdminRights(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike,
    rights: Omit<tl.RawChatAdminRights, '_'>,
    rank = ''
): Promise<void> {
    const chat = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!chat)
        throw new MtCuteInvalidPeerTypeError(chatId, 'channel')

    const user = normalizeToInputUser(await this.resolvePeer(userId))
    if (!user)
        throw new MtCuteInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'channels.editAdmin',
        channel: chat,
        userId: user,
        adminRights: {
            _: 'chatAdminRights',
            ...rights
        },
        rank
    })

    this._handleUpdate(res)
}
