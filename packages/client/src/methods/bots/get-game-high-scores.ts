import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError } from '../../types'
import { GameHighScore } from '../../types/bots/game-high-score'
import { tl } from '@mtcute/tl'
import {
    createUsersChatsIndex,
    normalizeToInputUser,
} from '../../utils/peer-utils'

/**
 * Get high scores of a game
 *
 * @param chatId  ID of the chat where the game was found
 * @param message  ID of the message containing the game
 * @param userId  ID of the user to find high scores for
 * @internal
 */
export async function getGameHighScores(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    userId?: InputPeerLike
): Promise<GameHighScore[]> {
    const chat = await this.resolvePeer(chatId)

    let user: tl.TypeInputUser
    if (userId) {
        const res = normalizeToInputUser(await this.resolvePeer(userId))
        if (!res) throw new MtCuteInvalidPeerTypeError(userId, 'user')

        user = res
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await this.call({
        _: 'messages.getGameHighScores',
        peer: chat,
        id: message,
        userId: user,
    })

    const { users } = createUsersChatsIndex(res)

    return res.scores.map((score) => new GameHighScore(this, score, users))
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
    userId?: InputPeerLike
): Promise<GameHighScore[]> {
    const [id, connection] = await this._normalizeInline(messageId)

    let user: tl.TypeInputUser
    if (userId) {
        const res = normalizeToInputUser(await this.resolvePeer(userId))
        if (!res) throw new MtCuteInvalidPeerTypeError(userId, 'user')

        user = res
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await this.call(
        {
            _: 'messages.getInlineGameHighScores',
            id,
            userId: user,
        },
        { connection }
    )

    const { users } = createUsersChatsIndex(res)

    return res.scores.map((score) => new GameHighScore(this, score, users))
}
