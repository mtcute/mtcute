import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import {
    createUsersChatsIndex,
    isInputPeerChannel,
    normalizeToInputChannel,
    normalizeToInputPeer,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'
import { Message, InputPeerLike, MtCuteTypeAssertionError } from '../../types'

/**
 * Get a single message in chat by its ID
 *
 * **Note**: this method might return empty message
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageId  Messages ID
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 * @internal
 */
export async function getMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    fromReply?: boolean
): Promise<Message>
/**
 * Get messages in chat by their IDs
 *
 * **Note**: this method might return empty messages
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageIds  Messages IDs
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 * @internal
 */
export async function getMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageIds: number[],
    fromReply?: boolean
): Promise<Message[]>

/** @internal */
export async function getMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
    fromReply = false
): Promise<MaybeArray<Message>> {
    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))

    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = (messageIds as number[]).map((it) => ({
        _: type,
        id: it,
    }))

    const res = await this.call(
        isInputPeerChannel(peer)
            ? {
                  _: 'channels.getMessages',
                  id: ids,
                  channel: normalizeToInputChannel(peer),
              }
            : {
                  _: 'messages.getMessages',
                  id: ids,
              }
    )

    if (res._ === 'messages.messagesNotModified')
        throw new MtCuteTypeAssertionError(
            'getMessages',
            '!messages.messagesNotModified',
            res._
        )

    const { users, chats } = createUsersChatsIndex(res)

    const ret = res.messages.map((msg) => new Message(this, msg, users, chats))

    return isSingle ? ret[0] : ret
}
