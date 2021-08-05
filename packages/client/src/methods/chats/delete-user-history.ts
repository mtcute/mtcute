import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import {
    normalizeToInputChannel,
    normalizeToInputUser,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete all messages of a user in a supergroup
 *
 * @param chatId  Chat ID
 * @param userId  User ID
 * @internal
 */
export async function deleteUserHistory(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike
): Promise<void> {
    const channel = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!channel) throw new MtInvalidPeerTypeError(chatId, 'channel')

    const user = normalizeToInputUser(await this.resolvePeer(userId))
    if (!user) throw new MtInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'channels.deleteUserHistory',
        channel,
        userId: user,
    })

    this._handleUpdate(
        createDummyUpdate(
            res.pts,
            res.ptsCount,
            (channel as tl.RawInputChannel).channelId
        )
    )
}
