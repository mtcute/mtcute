import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { GameHighScore, InputMessageId, InputPeerLike, normalizeInputMessageId, PeersIndex } from '../../types/index.js'
import { normalizeInlineId } from '../../utils/inline-utils.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/**
 * Get high scores of a game
 */
export async function getGameHighScores(
    client: ITelegramClient,
    params: InputMessageId & {
        /** ID of the user to find high scores for */
        userId?: InputPeerLike
    },
): Promise<GameHighScore[]> {
    const { userId } = params
    const { chatId, message } = normalizeInputMessageId(params)

    const chat = await resolvePeer(client, chatId)

    let user: tl.TypeInputUser

    if (userId) {
        user = await resolveUser(client, userId)
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await client.call({
        _: 'messages.getGameHighScores',
        peer: chat,
        id: message,
        userId: user,
    })

    const peers = PeersIndex.from(res)

    return res.scores.map((score) => new GameHighScore(score, peers))
}

/**
 * Get high scores of a game from an inline message
 *
 * @param messageId  ID of the inline message containing the game
 * @param userId  ID of the user to find high scores for
 */
export async function getInlineGameHighScores(
    client: ITelegramClient,
    messageId: string | tl.TypeInputBotInlineMessageID,
    userId?: InputPeerLike,
): Promise<GameHighScore[]> {
    const id = normalizeInlineId(messageId)

    let user: tl.TypeInputUser

    if (userId) {
        user = await resolveUser(client, userId)
    } else {
        user = { _: 'inputUserEmpty' }
    }

    const res = await client.call(
        {
            _: 'messages.getInlineGameHighScores',
            id,
            userId: user,
        },
        { dcId: id.dcId },
    )

    const peers = PeersIndex.from(res)

    return res.scores.map((score) => new GameHighScore(score, peers))
}
