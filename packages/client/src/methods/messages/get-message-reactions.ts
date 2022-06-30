import { getMarkedPeerId, MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, PeersIndex, MessageReactions } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Get reactions to a message.
 *
 * > Apps should short-poll reactions for visible messages
 * > (that weren't sent by the user) once every 15-30 seconds,
 * > but only if `message.reactions` is set
 *
 * @param chatId  ID of the chat with the message
 * @param messages  Message ID
 * @returns  Reactions to the corresponding message, or `null` if there are none
 * @internal
 */
export async function getMessageReactions(
    this: TelegramClient,
    chatId: InputPeerLike,
    messages: number
): Promise<MessageReactions | null>

/**
 * Get reactions to messages.
 *
 * > Apps should short-poll reactions for visible messages
 * > (that weren't sent by the user) once every 15-30 seconds,
 * > but only if `message.reactions` is set
 *
 * @param chatId  ID of the chat with messages
 * @param messages  Message IDs
 * @returns  Reactions to corresponding messages, or `null` if there are none
 * @internal
 */
export async function getMessageReactions(
    this: TelegramClient,
    chatId: InputPeerLike,
    messages: number[]
): Promise<(MessageReactions | null)[]>

/**
 * @internal
 */
export async function getMessageReactions(
    this: TelegramClient,
    chatId: InputPeerLike,
    messages: MaybeArray<number>
): Promise<MaybeArray<MessageReactions | null>> {
    const single = !Array.isArray(messages)
    if (!Array.isArray(messages)) {
        messages = [messages]
    }

    const res = await this.call({
        _: 'messages.getMessagesReactions',
        peer: await this.resolvePeer(chatId),
        id: messages,
    })

    assertIsUpdatesGroup('messages.getMessagesReactions', res)

    // normally the group contains updateMessageReactions
    // for each message requested that has reactions
    //
    // these updates are not ordered in any way, so
    // we don't need to pass them to updates engine

    const index: Record<number, MessageReactions> = {}

    const peers = PeersIndex.from(res)

    for (const update of res.updates) {
        assertTypeIs(
            'messages.getMessagesReactions',
            update,
            'updateMessageReactions'
        )

        index[update.msgId] = new MessageReactions(
            this,
            update.msgId,
            getMarkedPeerId(update.peer),
            update.reactions,
            peers
        )
    }

    if (single) {
        return index[messages[0]] ?? null
    }

    return messages.map((messageId) => index[messageId] ?? null)
}
