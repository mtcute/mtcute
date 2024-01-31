import { ITelegramClient } from '../../client.types.js'

/**
 * Gets the current default value of the Time-To-Live setting, applied to all new chats.
 */
export async function getGlobalTtl(client: ITelegramClient): Promise<number> {
    return client
        .call({
            _: 'messages.getDefaultHistoryTTL',
        })
        .then((r) => r.period)
}
