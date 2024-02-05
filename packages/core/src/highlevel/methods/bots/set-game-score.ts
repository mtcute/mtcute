import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMessageId, InputPeerLike, Message, normalizeInputMessageId } from '../../types/index.js'
import { normalizeInlineId } from '../../utils/inline-utils.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/**
 * Set a score of a user in a game
 *
 * @param params
 * @returns  The modified message
 */
export async function setGameScore(
    client: ITelegramClient,
    params: InputMessageId & {
        /** ID of the user who has scored */
        userId: InputPeerLike

        /** The new score (must be >0) */
        score: number

        /**
         * When `true`, the game message will not be modified
         * to include the new score
         */
        noEdit?: boolean

        /**
         * Whether to allow user's score to decrease.
         * This can be useful when fixing mistakes or banning cheaters
         */
        force?: boolean

        /**
         * Whether to dispatch the edit message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { userId, score, noEdit, force, shouldDispatch } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const user = await resolveUser(client, userId)
    const chat = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.setGameScore',
        peer: chat,
        id: message,
        userId: user,
        score,
        editMessage: !noEdit,
        force,
    })

    return _findMessageInUpdate(client, res, true, !shouldDispatch)
}

/**
 * Set a score of a user in a game contained in
 * an inline message
 *
 * @param params
 */
export async function setInlineGameScore(
    client: ITelegramClient,
    params: {
        /** ID of the inline message */
        messageId: string | tl.TypeInputBotInlineMessageID
        /** ID of the user who has scored */
        userId: InputPeerLike
        /** The new score (must be >0) */
        score: number
        /**
         * When `true`, the game message will not be modified
         * to include the new score
         */
        noEdit?: boolean

        /**
         * Whether to allow user's score to decrease.
         * This can be useful when fixing mistakes or banning cheaters
         */
        force?: boolean
    },
): Promise<void> {
    const { messageId, userId, score, noEdit, force } = params

    const user = await resolveUser(client, userId)

    const id = normalizeInlineId(messageId)

    const r = await client.call(
        {
            _: 'messages.setInlineGameScore',
            id,
            userId: user,
            score,
            editMessage: !noEdit,
            force: force,
        },
        { dcId: id.dcId },
    )

    assertTrue('messages.setInlineGameScore', r)
}
