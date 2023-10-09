import { BaseTelegramClient } from '@mtcute/core'

import { InputMessageId, InputReaction, Message, normalizeInputMessageId, normalizeInputReaction } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'
import { _findMessageInUpdate } from './find-in-update'

/**
 * Send or remove a reaction.
 *
 * @returns  Message to which the reaction was sent
 */
export async function sendReaction(
    client: BaseTelegramClient,
    params: InputMessageId & {
        /** Reaction emoji (or `null` to remove reaction) */
        emoji?: InputReaction | null
        /** Whether to use a big reaction */
        big?: boolean
    },
): Promise<Message> {
    const { emoji, big } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const reaction = normalizeInputReaction(emoji)

    const res = await client.call({
        _: 'messages.sendReaction',
        peer: await resolvePeer(client, chatId),
        msgId: message,
        reaction: [reaction],
        big,
    })

    assertIsUpdatesGroup('messages.sendReaction', res)

    // normally the group contains 2 updates:
    // updateEdit(Channel)Message
    // updateMessageReactions
    // idk why, they contain literally the same data
    // so we can just return the message from the first one

    return _findMessageInUpdate(client, res, true)
}
