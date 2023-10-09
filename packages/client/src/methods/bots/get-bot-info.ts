import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Gets information about a bot the current uzer owns (or the current bot)
 */
export async function getBotInfo(
    client: BaseTelegramClient,
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
        bot: bot ? normalizeToInputUser(await resolvePeer(client, bot), bot) : undefined,
        langCode: langCode,
    })
}
