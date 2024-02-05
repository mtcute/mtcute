import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Sets information about a bot the current uzer owns (or the current bot)
 */
export async function setBotInfo(
    client: ITelegramClient,
    params: {
        /**
         * When called by a user, a bot the user owns must be specified.
         * When called by a bot, must be empty
         */
        bot?: InputPeerLike

        /**
         * If passed, will update the bot's description in the given language.
         * If left empty, will change the fallback description.
         */
        langCode?: string

        /** New bot name */
        name?: string

        /** New bio text (displayed in the profile) */
        bio?: string

        /** New description text (displayed when the chat is empty) */
        description?: string
    },
): Promise<void> {
    const { bot, langCode = '', name, bio, description } = params

    const r = await client.call({
        _: 'bots.setBotInfo',
        bot: bot ? await resolveUser(client, bot) : undefined,
        langCode: langCode,
        name,
        about: bio,
        description,
    })

    assertTrue('bots.setBotInfo', r)
}
