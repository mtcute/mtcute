import { TelegramClient } from '../../client'

/**
 * Change user status to offline or online
 *
 * @param offline  Whether the user is currently offline
 * @internal
 */
export async function setOffline(this: TelegramClient, offline = true): Promise<void> {
    await this.call({
        _: 'account.updateStatus',
        offline,
    })
}
