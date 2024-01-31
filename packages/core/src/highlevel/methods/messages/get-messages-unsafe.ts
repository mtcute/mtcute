import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message, PeersIndex } from '../../types/index.js'

/**
 * Get messages from PM or legacy group by their IDs.
 * For channels, use {@link getMessages}.
 *
 * Unlike {@link getMessages}, this method does not
 * check if the message belongs to some chat.
 *
 * Fot messages that were not found, `null` will be
 * returned at that position.
 *
 * @param messageIds  Messages IDs
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 */
export async function getMessagesUnsafe(
    client: ITelegramClient,
    messageIds: MaybeArray<number>,
    fromReply = false,
): Promise<(Message | null)[]> {
    if (!Array.isArray(messageIds)) messageIds = [messageIds]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = messageIds.map((it) => ({
        _: type,
        id: it,
    }))

    const res = await client.call({
        _: 'messages.getMessages',
        id: ids,
    })

    assertTypeIsNot('getMessagesUnsafe', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    return res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        return new Message(msg, peers)
    })
}
