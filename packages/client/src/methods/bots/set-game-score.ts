import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike, Message } from '../../types'
import { normalizeInlineId } from '../../utils/inline-utils'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { _findMessageInUpdate } from '../messages/find-in-update'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Set a score of a user in a game
 *
 * @param params
 * @returns  The modified message
 */
export async function setGameScore(
    client: BaseTelegramClient,
    params: {
        /** Chat where the game was found */
        chatId: InputPeerLike

        /** ID of the message where the game was found */
        message: number

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
): Promise<Message> {
    const { chatId, message, userId, score, noEdit, force } = params

    const user = normalizeToInputUser(await resolvePeer(client, userId), userId)
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

    return _findMessageInUpdate(client, res, true)
}

/**
 * Set a score of a user in a game contained in
 * an inline message
 *
 * @param params
 */
export async function setInlineGameScore(
    client: BaseTelegramClient,
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

    const user = normalizeToInputUser(await resolvePeer(client, userId), userId)

    const id = normalizeInlineId(messageId)

    await client.call(
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
}
