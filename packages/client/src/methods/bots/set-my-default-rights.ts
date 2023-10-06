import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'

/**
 * Sets the default chat permissions for the bot in the supergroup or channel.
 *
 * @internal
 */
export async function setMyDefaultRights(
    this: TelegramClient,
    params: {
        /** Whether to target groups or channels. */
        target: 'channel' | 'group'
        /** The default chat permissions. */
        rights: Omit<tl.RawChatAdminRights, '_'>
    },
): Promise<void> {
    const { target, rights } = params

    await this.call({
        _: target === 'group' ? 'bots.setBotGroupDefaultAdminRights' : 'bots.setBotBroadcastDefaultAdminRights',
        adminRights: {
            _: 'chatAdminRights',
            ...rights,
        },
    })
}
