import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

/**
 * Change user status to offline or online
 *
 * @param offline  Whether the user is currently offline
 */
export async function setOffline(client: BaseTelegramClient, offline = true): Promise<void> {
    const r = await client.call({
        _: 'account.updateStatus',
        offline,
    })

    assertTrue('account.updateStatus', r)
}
