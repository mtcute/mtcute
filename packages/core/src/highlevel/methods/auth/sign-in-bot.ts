import { ITelegramClient } from '../../client.types.js'
import { User } from '../../types/peers/user.js'
import { _onAuthorization } from './utils.js'

/**
 * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
 *
 * @param token  Bot token issued by BotFather
 * @returns  Bot's {@link User} object
 * @throws BadRequestError  In case the bot token is invalid
 */
export async function signInBot(client: ITelegramClient, token: string): Promise<User> {
    const { id, hash } = await client.getApiCrenetials()

    const res = await client.call({
        _: 'auth.importBotAuthorization',
        flags: 0,
        apiId: id,
        apiHash: hash,
        botAuthToken: token,
    })

    return _onAuthorization(client, res)
}
