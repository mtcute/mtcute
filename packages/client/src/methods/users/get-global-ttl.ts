import { TelegramClient } from '../../client'

/**
 * Gets the current default value of the Time-To-Live setting, applied to all new chats.
 *
 * @internal
 */
export async function getGlobalTtl(this: TelegramClient): Promise<number> {
    return this.call({
        _: 'messages.getDefaultHistoryTTL',
    }).then((r) => r.period)
}
