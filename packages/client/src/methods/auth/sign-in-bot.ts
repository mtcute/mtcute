import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types/index.js'
import { _onAuthorization } from './_state.js'

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
        apiId: client.params.apiId,
        apiHash: client.params.apiHash,
        botAuthToken: token,
    })

    return _onAuthorization(client, res)
}
