import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { BotCommands } from '../../types'

/**
 * Delete commands for the current bot and the given scope.
 *
 * Does the same as passing `null` to  {@link setMyCommands}
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 *
 * @internal
 */
export async function deleteMyCommands(
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
    },
): Promise<void> {
    const scope: tl.TypeBotCommandScope = params?.scope ?
        await this._normalizeCommandScope(params.scope) :
        {
            _: 'botCommandScopeDefault',
        }

    await this.call({
        _: 'bots.resetBotCommands',
        scope,
        langCode: params?.langCode ?? '',
    })
}
