import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { BotCommands } from '../../types/index.js'
import { _normalizeCommandScope } from './normalize-command-scope.js'

/**
 * Get a list of current bot's commands for the given command scope
 * and user language. If they are not set, empty set is returned.
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 */
export async function getMyCommands(
    client: ITelegramClient,
    params?: {
        /**
         * Scope of the commands.
         *
         * @default  `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    },
): Promise<tl.RawBotCommand[]> {
    return client.call({
        _: 'bots.getBotCommands',
        scope: params?.scope ?
            await _normalizeCommandScope(client, params.scope) :
            {
                _: 'botCommandScopeDefault',
            },
        langCode: params?.langCode ?? '',
    })
}
