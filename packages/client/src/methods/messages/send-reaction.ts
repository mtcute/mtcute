import { TelegramClient } from '../../client'
import { InputPeerLike, InputReaction, Message, normalizeInputReaction } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Send or remove a reaction.
 *
 * @param chatId  Chat ID with the message to react to
 * @param message  Message ID to react to
 * @param emoji  Reaction emoji (or `null` to remove reaction)
 * @param big  Whether to use a big reaction
 * @returns  Message to which the reaction was sent
 * @internal
 */
export async function sendReaction(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    emoji?: InputReaction | null,
    big = false,
): Promise<Message> {
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
