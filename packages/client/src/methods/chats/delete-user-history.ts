import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete all messages of a user (or channel) in a supergroup
 *
 * @param chatId  Chat ID
 * @param participantId  User/channel ID
 * @internal
 */
export async function deleteUserHistory(
    this: TelegramClient,
    chatId: InputPeerLike,
    participantId: InputPeerLike,
): Promise<void> {
    const channel = normalizeToInputChannel(await this.resolvePeer(chatId), chatId)

    const peer = await this.resolvePeer(participantId)

    const res = await this.call({
        _: 'channels.deleteParticipantHistory',
        channel,
        participant: peer,
    })

    this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount, (channel as tl.RawInputChannel).channelId))
}
