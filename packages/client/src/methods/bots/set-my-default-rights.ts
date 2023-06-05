import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'

/**
 * Sets the default chat permissions for the bot in the supergroup or channel.
 *
 * @param target  Whether to target groups or channels.
 * @param rights  The default chat permissions.
 * @internal
 */
export async function setMyDefaultRights(
    this: TelegramClient,
    target: 'channel' | 'group',
    rights: Omit<tl.RawChatAdminRights, '_'>,
): Promise<void> {
    await this.call({
        _:
            target === 'group' ?
                'bots.setBotGroupDefaultAdminRights' :
                'bots.setBotBroadcastDefaultAdminRights',
        adminRights: {
            _: 'chatAdminRights',
            ...rights,
        },
    })
}
