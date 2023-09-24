import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { BotCommands } from '../../types'

/**
 * Set or delete commands for the current bot and the given scope
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 *
 * @internal
 */
export async function setMyCommands(
    this: TelegramClient,
    params: {
        /**
         * New list of bot commands for the given scope.
         *
         * Pass empty array or `null` to delete them.
         */
        commands: tl.RawBotCommand[] | null

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
    const scope: tl.TypeBotCommandScope = params.scope ?
        await this._normalizeCommandScope(params.scope) :
        {
            _: 'botCommandScopeDefault',
        }

    if (params.commands?.length) {
        await this.call({
            _: 'bots.setBotCommands',
            commands: params.commands,
            scope,
            langCode: params.langCode ?? '',
        })
    } else {
        await this.call({
            _: 'bots.resetBotCommands',
            scope,
            langCode: params.langCode ?? '',
        })
    }
}
