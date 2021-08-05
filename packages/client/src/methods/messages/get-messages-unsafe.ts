import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import {
    createUsersChatsIndex,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'
import { Message, MtTypeAssertionError } from '../../types'

/**
 * Get a single message from PM or legacy group by its ID.
 * For channels, use {@link getMessages}.
 *
 * Unlike {@link getMessages}, this method does not
 * check if the message belongs to some chat.
 *
 * @param messageId  Messages ID
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 * @internal
 */
export async function getMessagesUnsafe(
    this: TelegramClient,
    messageId: number,
    fromReply?: boolean
): Promise<Message | null>
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
 * @internal
 */
export async function getMessagesUnsafe(
    this: TelegramClient,
    messageIds: number[],
    fromReply?: boolean
): Promise<(Message | null)[]>

/** @internal */
export async function getMessagesUnsafe(
    this: TelegramClient,
    messageIds: MaybeArray<number>,
    fromReply = false
): Promise<MaybeArray<Message | null>> {
    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = (messageIds as number[]).map((it) => ({
        _: type,
        id: it,
    }))

    const res = await this.call({
        _: 'messages.getMessages',
        id: ids,
    })

    if (res._ === 'messages.messagesNotModified')
        throw new MtTypeAssertionError(
            'getMessages',
            '!messages.messagesNotModified',
            res._
        )

    const { users, chats } = createUsersChatsIndex(res)

    const ret = res.messages
        .map((msg) => {
            if (msg._ === 'messageEmpty') return null

            return new Message(this, msg, users, chats)
        })

    return isSingle ? ret[0] : ret
}
