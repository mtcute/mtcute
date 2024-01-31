import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Sets the default chat permissions for the bot in the supergroup or channel.
 */
export async function setMyDefaultRights(
    client: ITelegramClient,
    params: {
        /** Whether to target groups or channels. */
        target: 'channel' | 'group'
        /** The default chat permissions. */
        rights: Omit<tl.RawChatAdminRights, '_'>
    },
): Promise<void> {
    const { target, rights } = params

    const r = await client.call({
        _: target === 'group' ? 'bots.setBotGroupDefaultAdminRights' : 'bots.setBotBroadcastDefaultAdminRights',
        adminRights: {
            _: 'chatAdminRights',
            ...rights,
        },
    })

    assertTrue('bots.setBotGroupDefaultAdminRights', r)
}
