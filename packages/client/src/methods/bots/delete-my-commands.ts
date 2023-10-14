import { BaseTelegramClient, tl } from '@mtcute/core'

import { BotCommands } from '../../types/index.js'
import { _normalizeCommandScope } from './normalize-command-scope.js'

/**
 * Delete commands for the current bot and the given scope.
 *
 * Does the same as passing `null` to  {@link setMyCommands}
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 */
export async function deleteMyCommands(
    client: BaseTelegramClient,
    params?: {
        /**
         * Scope of the commands.
         *
         * Defaults to `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    },
): Promise<void> {
    const scope: tl.TypeBotCommandScope = params?.scope ?
        await _normalizeCommandScope(client, params.scope) :
        {
            _: 'botCommandScopeDefault',
        }

    await client.call({
        _: 'bots.resetBotCommands',
        scope,
        langCode: params?.langCode ?? '',
    })
}
