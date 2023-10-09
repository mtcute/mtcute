import { BaseTelegramClient } from '@mtcute/core'

/**
 * Gets the current default value of the Time-To-Live setting, applied to all new chats.
 */
export async function getGlobalTtl(client: BaseTelegramClient): Promise<number> {
    return client
        .call({
            _: 'messages.getDefaultHistoryTTL',
        })
        .then((r) => r.period)
}
