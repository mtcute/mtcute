import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { GameHighScore, InputPeerLike, PeersIndex } from '../../types'
import { normalizeInlineId } from '../../utils/inline-utils'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get high scores of a game
 *
 * @internal
 */
export async function getGameHighScores(
    this: TelegramClient,
    params: {
        /** ID of the chat where the game was found */
        chatId: InputPeerLike

        /** ID of the message containing the game */
        message: number

        /** ID of the user to find high scores for */
        userId?: InputPeerLike
    },
): Promise<GameHighScore[]> {
    const { chatId, message, userId } = params

    const chat = await this.resolvePeer(chatId)

    let user: tl.TypeInputUser

    if (userId) {
        user = normalizeToInputUser(await this.resolvePeer(userId), userId)
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await this.call({
        _: 'messages.getGameHighScores',
        peer: chat,
        id: message,
        userId: user,
    })

    const peers = PeersIndex.from(res)

    return res.scores.map((score) => new GameHighScore(this, score, peers))
}

/**
 * Get high scores of a game from an inline message
 *
 * @param messageId  ID of the inline message containing the game
 * @param userId  ID of the user to find high scores for
 * @internal
 */
export async function getInlineGameHighScores(
    this: TelegramClient,
    messageId: string | tl.TypeInputBotInlineMessageID,
    userId?: InputPeerLike,
): Promise<GameHighScore[]> {
    const id = normalizeInlineId(messageId)

    let user: tl.TypeInputUser

    if (userId) {
        user = normalizeToInputUser(await this.resolvePeer(userId), userId)
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await this.call(
        {
            _: 'messages.getInlineGameHighScores',
            id,
            userId: user,
        },
        { dcId: id.dcId },
    )

    const peers = PeersIndex.from(res)

    return res.scores.map((score) => new GameHighScore(this, score, peers))
}
