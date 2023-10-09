import { BaseTelegramClient } from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import type { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Delete a forum topic and all its history
 *
 * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
 * @param topicId  ID of the topic (i.e. its top message ID)
 */
export async function deleteForumTopicHistory(
    client: BaseTelegramClient,
    chat: InputPeerLike,
    topicId: number | ForumTopic,
): Promise<void> {
    const channel = normalizeToInputChannel(await resolvePeer(client, chat), chat)
    assertTypeIsNot('deleteForumTopicHistory', channel, 'inputChannelEmpty')

    const res = await client.call({
        _: 'channels.deleteTopicHistory',
        channel,
        topMsgId: typeof topicId === 'number' ? topicId : topicId.id,
    })

    client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount, channel.channelId))
}
