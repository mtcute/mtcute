import { BaseTelegramClient } from '@mtcute/core'

/**
 * Change user status to offline or online
 *
 * @param offline  Whether the user is currently offline
 */
export async function setOffline(client: BaseTelegramClient, offline = true): Promise<void> {
    await client.call({
        _: 'account.updateStatus',
        offline,
    })
}
