import { BaseTelegramClient, tl } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

/**
 * Sets the default chat permissions for the bot in the supergroup or channel.
 */
export async function setMyDefaultRights(
    client: BaseTelegramClient,
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
