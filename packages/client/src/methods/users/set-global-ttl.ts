import { TelegramClient } from '../../client'

/**
 * Changes the current default value of the Time-To-Live setting,
 * applied to all new chats.
 *
 * @param period  New TTL period, in seconds (or 0 to disable)
 * @internal
 */
export async function setGlobalTtl(this: TelegramClient, period: number): Promise<void> {
    await this.call({
        _: 'messages.setDefaultHistoryTTL',
        period,
    })
}
