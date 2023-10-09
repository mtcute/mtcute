import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types'
import { _onAuthorization } from './_state'

/**
 * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
 *
 * @param token  Bot token issued by BotFather
 * @returns  Bot's {@link User} object
 * @throws BadRequestError  In case the bot token is invalid
 */
export async function signInBot(client: BaseTelegramClient, token: string): Promise<User> {
    const res = await client.call({
        _: 'auth.importBotAuthorization',
        flags: 0,
        apiId: client.network._initConnectionParams.apiId,
        // eslint-disable-next-line dot-notation
        apiHash: client['_apiHash'],
        botAuthToken: token,
    })

    return _onAuthorization(client, res, true)
}
