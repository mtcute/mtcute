import { assertTypeIsNot } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete a forum topic and all its history
 *
 * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @internal
 */
export async function deleteForumTopicHistory(
    this: TelegramClient,
    chat: InputPeerLike,
    topicId: number,
): Promise<void> {
    const channel = normalizeToInputChannel(await this.resolvePeer(chat), chat)
    assertTypeIsNot('deleteForumTopicHistory', channel, 'inputChannelEmpty')

    const res = await this.call({
        _: 'channels.deleteTopicHistory',
        channel,
        topMsgId: topicId,
    })

    this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount, channel.channelId))
}
