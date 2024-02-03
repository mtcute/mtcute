import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import type { ForumTopic, InputPeerLike } from '../../types/index.js'
import { createDummyUpdate } from '../../updates/utils.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete a forum topic and all its history
 *
 * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
 * @param topicId  ID of the topic (i.e. its top message ID)
 */
export async function deleteForumTopicHistory(
    client: ITelegramClient,
    chat: InputPeerLike,
    topicId: number | ForumTopic,
): Promise<void> {
    const channel = toInputChannel(await resolvePeer(client, chat), chat)
    assertTypeIsNot('deleteForumTopicHistory', channel, 'inputChannelEmpty')

    const res = await client.call({
        _: 'channels.deleteTopicHistory',
        channel,
        topMsgId: typeof topicId === 'number' ? topicId : topicId.id,
    })

    client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount, channel.channelId))
}
