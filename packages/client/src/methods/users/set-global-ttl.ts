import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

/**
 * Changes the current default value of the Time-To-Live setting,
 * applied to all new chats.
 *
 * @param period  New TTL period, in seconds (or 0 to disable)
 */
export async function setGlobalTtl(client: BaseTelegramClient, period: number): Promise<void> {
    const r = await client.call({
        _: 'messages.setDefaultHistoryTTL',
        period,
    })

    assertTrue('messages.setDefaultHistoryTTL', r)
}
