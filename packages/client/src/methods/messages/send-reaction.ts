import { TelegramClient } from '../../client'
import { InputPeerLike, InputReaction, Message, normalizeInputReaction } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Send or remove a reaction.
 *
 * @returns  Message to which the reaction was sent
 * @internal
 */
export async function sendReaction(
    this: TelegramClient,
    params: {
        /** Chat ID with the message to react to */
        chatId: InputPeerLike
        /** Message ID to react to */
        message: number
        /** Reaction emoji (or `null` to remove reaction) */
        emoji?: InputReaction | null
        /** Whether to use a big reaction */
        big?: boolean
    },
): Promise<Message> {
    const { chatId, message, emoji, big } = params

    const reaction = normalizeInputReaction(emoji)

    const res = await this.call({
        _: 'messages.sendReaction',
        peer: await this.resolvePeer(chatId),
        msgId: message,
        reaction: [reaction],
        big,
    })

    assertIsUpdatesGroup('messages.sendReaction', res)

    // normally the group contains 2 updates:
    // updateEditChannelMessage
    // updateMessageReactions
    // idk why, they contain literally the same data
    // so we can just return the message from the first one

    return this._findMessageInUpdate(res, true)
}
