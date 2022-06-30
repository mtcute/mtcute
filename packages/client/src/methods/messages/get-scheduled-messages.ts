import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import {
    Message,
    InputPeerLike,
    MtTypeAssertionError,
    PeersIndex,
} from '../../types'

/**
 * Get a single scheduled message in chat by its ID
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageId  Scheduled message ID
 * @internal
 */
export async function getScheduledMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageId: number
): Promise<Message | null>
/**
 * Get scheduled messages in chat by their IDs
 *
 * Fot messages that were not found, `null` will be
 * returned at that position.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageIds  Scheduled messages IDs
 * @internal
 */
export async function getScheduledMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageIds: number[]
): Promise<(Message | null)[]>

/** @internal */
export async function getScheduledMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>
): Promise<MaybeArray<Message | null>> {
    const peer = await this.resolvePeer(chatId)

    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const res = await this.call({
        _: 'messages.getScheduledMessages',
        peer,
        id: messageIds as number[],
    })

    if (res._ === 'messages.messagesNotModified')
        throw new MtTypeAssertionError(
            'getMessages',
            '!messages.messagesNotModified',
            res._
        )

    const peers = PeersIndex.from(res)

    const ret = res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        return new Message(this, msg, peers, true)
    })

    return isSingle ? ret[0] : ret
}
