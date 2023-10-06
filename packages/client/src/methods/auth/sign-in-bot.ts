import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
 *
 * @param token  Bot token issued by BotFather
 * @returns  Bot's {@link User} object
 * @throws BadRequestError  In case the bot token is invalid
 * @internal
 */
export async function signInBot(this: TelegramClient, token: string): Promise<User> {
    const res = await this.call({
        _: 'auth.importBotAuthorization',
        flags: 0,
        apiId: this.network._initConnectionParams.apiId,
        apiHash: this._apiHash,
        botAuthToken: token,
    })

    return this._onAuthorization(res, true)
}
