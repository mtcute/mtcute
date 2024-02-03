import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { BotCommands } from '../../types/index.js'
import { _normalizeCommandScope } from './normalize-command-scope.js'

/**
 * Set or delete commands for the current bot and the given scope
 *
 * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 */
export async function setMyCommands(
    client: ITelegramClient,
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
         * @default  `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    },
): Promise<void> {
    const scope: tl.TypeBotCommandScope = params.scope ?
        await _normalizeCommandScope(client, params.scope) :
        {
            _: 'botCommandScopeDefault',
        }

    if (params.commands?.length) {
        const r = await client.call({
            _: 'bots.setBotCommands',
            commands: params.commands,
            scope,
            langCode: params.langCode ?? '',
        })

        assertTrue('bots.setBotCommands', r)
    } else {
        const r = await client.call({
            _: 'bots.resetBotCommands',
            scope,
            langCode: params.langCode ?? '',
        })

        assertTrue('bots.resetBotCommands', r)
    }
}
