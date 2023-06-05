import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Mark all reactions in chat as read.
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function readReactions(
    this: TelegramClient,
    chatId: InputPeerLike,
): Promise<void> {
    const res = await this.call({
        _: 'messages.readReactions',
        peer: await this.resolvePeer(chatId),
    })
    this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
}
