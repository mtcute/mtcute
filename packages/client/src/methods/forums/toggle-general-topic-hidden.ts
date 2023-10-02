import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Toggle whether "General" topic in a forum is hidden or not
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param hidden  Whether the topic should be hidden
 * @returns  Service message about the modification
 * @internal
 */
export async function toggleGeneralTopicHidden(
    this: TelegramClient,
    chatId: InputPeerLike,
    hidden: boolean,
): Promise<Message> {
    const res = await this.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId: 1,
        hidden,
    })

    return this._findMessageInUpdate(res)
}
