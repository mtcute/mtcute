import { User } from '../../types'
import { TelegramClient } from '../../client'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
 *
 * @param token  Bot token issued by BotFather
 * @returns  Bot's {@link User} object
 * @throws BadRequestError  In case the bot token is invalid
 * @internal
 */
export async function signInBot(
    this: TelegramClient,
    token: string
): Promise<User> {
    const res = await this.call({
        _: 'auth.importBotAuthorization',
        flags: 0,
        apiId: this._initConnectionParams.apiId,
        apiHash: this._apiHash,
        botAuthToken: token,
    })

    assertTypeIs(
        'signInBot (@ auth.importBotAuthorization)',
        res,
        'auth.authorization'
    )
    assertTypeIs(
        'signInBot (@ auth.importBotAuthorization -> user)',
        res.user,
        'user'
    )

    await this.storage.setSelf({
        userId: res.user.id,
        isBot: true,
    })
    await this.storage.save?.()

    return new User(this, res.user)
}
