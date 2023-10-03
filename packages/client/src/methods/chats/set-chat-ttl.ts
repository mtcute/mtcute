import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Set maximum Time-To-Live of all newly sent messages in the specified chat
 *
 * @param chatId  Chat ID
 * @param period  New TTL period, in seconds (or 0 to disable)
 * @internal
 */
export async function setChatTtl(this: TelegramClient, chatId: InputPeerLike, period: number): Promise<void> {
    await this.call({
        _: 'messages.setHistoryTTL',
        peer: await this.resolvePeer(chatId),
        period,
    })
}
