import { BaseTelegramClient } from '@mtcute/core'

/**
 * Changes the current default value of the Time-To-Live setting,
 * applied to all new chats.
 *
 * @param period  New TTL period, in seconds (or 0 to disable)
 */
export async function setGlobalTtl(client: BaseTelegramClient, period: number): Promise<void> {
    await client.call({
        _: 'messages.setDefaultHistoryTTL',
        period,
    })
}
