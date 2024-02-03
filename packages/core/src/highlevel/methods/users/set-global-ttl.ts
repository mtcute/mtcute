import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Changes the current default value of the Time-To-Live setting,
 * applied to all new chats.
 *
 * @param period  New TTL period, in seconds (or 0 to disable)
 */
export async function setGlobalTtl(client: ITelegramClient, period: number): Promise<void> {
    const r = await client.call({
        _: 'messages.setDefaultHistoryTTL',
        period,
    })

    assertTrue('messages.setDefaultHistoryTTL', r)
}
