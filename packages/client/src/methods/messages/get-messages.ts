import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import {
    isInputPeerChannel,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'
import { Message, InputPeerLike, MtTypeAssertionError, PeersIndex } from '../../types'

/**
 * Get a single message in chat by its ID
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
): Promise<Message | null>
/**
 * Get messages in chat by their IDs
 *
 * Fot messages that were not found, `null` will be
 * returned at that position.
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
): Promise<(Message | null)[]>

/** @internal */
export async function getMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
    fromReply = false
): Promise<MaybeArray<Message | null>> {
    const peer = await this.resolvePeer(chatId)

    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = (messageIds as number[]).map((it) => ({
        _: type,
        id: it,
    }))

    const isChannel = isInputPeerChannel(peer)

    const res = await this.call(
        isChannel
            ? {
                  _: 'channels.getMessages',
                  id: ids,
                  channel: normalizeToInputChannel(peer)!,
              }
            : {
                  _: 'messages.getMessages',
                  id: ids,
              }
    )

    if (res._ === 'messages.messagesNotModified')
        throw new MtTypeAssertionError(
            'getMessages',
            '!messages.messagesNotModified',
            res._
        )

    const peers = PeersIndex.from(res)

    const ret = res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        if (!isChannel) {
            // make sure that the messages belong to the given chat
            // (channels have their own message numbering)
            switch (peer._) {
                case 'inputPeerSelf':
                    if (!(msg.peerId._ === 'peerUser' && msg.peerId.userId === this._userId))
                        return null
                    break;
                case 'inputPeerUser':
                case 'inputPeerUserFromMessage':
                    if (!(msg.peerId._ === 'peerUser' && msg.peerId.userId === peer.userId))
                        return null
                    break;
                case 'inputPeerChat':
                    if (!(msg.peerId._ === 'peerChat' && msg.peerId.chatId === peer.chatId))
                        return null
                    break;
            }
        }

        return new Message(this, msg, peers)
    })

    return isSingle ? ret[0] : ret
}
