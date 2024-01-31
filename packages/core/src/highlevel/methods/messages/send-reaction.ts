import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import {
    InputMessageId,
    InputReaction,
    Message,
    normalizeInputMessageId,
    normalizeInputReaction,
} from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'

/**
 * Send or remove a reaction.
 *
 * @returns
 *   Message to which the reaction was sent, if available.
 *   The message is normally available for users, but may not be available for bots in PMs.
 */
export async function sendReaction(
    client: ITelegramClient,
    params: InputMessageId & {
        /** Reaction emoji (or `null` to remove reaction) */
        emoji?: MaybeArray<InputReaction> | null
        /** Whether to use a big reaction */
        big?: boolean

        /**
         * Whether to dispatch the returned edit message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message | null> {
    const { emoji, big } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const emojis = Array.isArray(emoji) ? emoji : [emoji]
    const reactions = emojis.map(normalizeInputReaction)

    const res = await client.call({
        _: 'messages.sendReaction',
        peer: await resolvePeer(client, chatId),
        msgId: message,
        reaction: reactions,
        big,
    })

    assertIsUpdatesGroup('messages.sendReaction', res)

    // normally the group contains 2 updates:
    // updateEdit(Channel)Message
    // updateMessageReactions
    // idk why, they contain literally the same data
    // so we can just return the message from the first one
    //
    // for whatever reason, sendReaction for bots returns empty updates
    // group in pms, so we should handle that too

    return _findMessageInUpdate(client, res, true, !params.shouldDispatch, true)
}
