import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Gets information about a bot the current uzer owns (or the current bot)
 */
export async function getBotInfo(
    client: ITelegramClient,
    params: {
        /**
         * When called by a user, a bot the user owns must be specified.
         * When called by a bot, must be empty
         */
        bot?: InputPeerLike

        /**
         * If passed, will retrieve the bot's description in the given language.
         * If left empty, will retrieve the fallback description.
         */
        langCode?: string
    },
): Promise<tl.bots.RawBotInfo> {
    const { bot, langCode = '' } = params

    return client.call({
        _: 'bots.getBotInfo',
        bot: bot ? await resolveUser(client, bot) : undefined,
        langCode: langCode,
    })
}
