import { BaseTelegramClient, tl } from '@mtcute/core'

import { GameHighScore, InputMessageId, InputPeerLike, normalizeInputMessageId, PeersIndex } from '../../types'
import { normalizeInlineId } from '../../utils/inline-utils'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get high scores of a game
 */
export async function getGameHighScores(
    client: BaseTelegramClient,
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
        user = normalizeToInputUser(await resolvePeer(client, userId), userId)
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
    client: BaseTelegramClient,
    messageId: string | tl.TypeInputBotInlineMessageID,
    userId?: InputPeerLike,
): Promise<GameHighScore[]> {
    const id = normalizeInlineId(messageId)

    let user: tl.TypeInputUser

    if (userId) {
        user = normalizeToInputUser(await resolvePeer(client, userId), userId)
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
