import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete all messages of a user (or channel) in a supergroup
 *
 * @internal
 */
export async function deleteUserHistory(
    this: TelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User/channel ID whose messages to delete */
        participantId: InputPeerLike
    },
): Promise<void> {
    const { chatId, participantId } = params

    const channel = normalizeToInputChannel(await this.resolvePeer(chatId), chatId)

    const peer = await this.resolvePeer(participantId)

    const res = await this.call({
        _: 'channels.deleteParticipantHistory',
        channel,
        participant: peer,
    })

    this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount, (channel as tl.RawInputChannel).channelId))
}
