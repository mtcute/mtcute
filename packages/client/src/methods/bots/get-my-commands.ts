import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { BotCommands } from '../../types'

/**
 * Get a list of current bot's commands for the given command scope
 * and user language. If they are not set, empty set is returned.
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 *
 * @internal
 */
export async function getMyCommands(
    this: TelegramClient,
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
    }
): Promise<tl.RawBotCommand[]> {
    return this.call({
        _: 'bots.getBotCommands',
        scope: params?.scope
            ? await this._normalizeCommandScope(params.scope)
            : {
                  _: 'botCommandScopeDefault',
              },
        langCode: params?.langCode ?? '',
    })
}
