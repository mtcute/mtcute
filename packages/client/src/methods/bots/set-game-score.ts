import { InputPeerLike, Message, MtCuteInvalidPeerTypeError } from '../../types'
import { TelegramClient } from '../../client'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Set a score of a user in a game
 *
 * @param chatId  Chat where the game was found
 * @param message  ID of the message where the game was found
 * @param userId  ID of the user who has scored
 * @param score  The new score (must be >0)
 * @param params
 * @returns  The modified message
 * @internal
 */
export async function setGameScore(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    userId: InputPeerLike,
    score: number,
    params?: {
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
    }
): Promise<Message> {
    if (!params) params = {}

    const chat = await this.resolvePeer(chatId)
    const user = normalizeToInputUser(await this.resolvePeer(userId))
    if (!user) throw new MtCuteInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'messages.setGameScore',
        peer: chat,
        id: message,
        userId: user,
        score,
        editMessage: !params.noEdit,
        force: params.force,
    })

    return this._findMessageInUpdate(res, true)
}

/**
 * Set a score of a user in a game contained in
 * an inline message
 *
 * @param messageId  ID of the inline message
 * @param userId  ID of the user who has scored
 * @param score  The new score (must be >0)
 * @param params
 * @internal
 */
export async function setInlineGameScore(
    this: TelegramClient,
    messageId: string | tl.TypeInputBotInlineMessageID,
    userId: InputPeerLike,
    score: number,
    params?: {
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
    }
): Promise<void> {
    if (!params) params = {}

    const user = normalizeToInputUser(await this.resolvePeer(userId))
    if (!user) throw new MtCuteInvalidPeerTypeError(userId, 'user')

    const [id, connection] = await this._normalizeInline(messageId)

    await this.call(
        {
            _: 'messages.setInlineGameScore',
            id,
            userId: user,
            score,
            editMessage: !params.noEdit,
            force: params.force,
        },
        { connection }
    )
}
