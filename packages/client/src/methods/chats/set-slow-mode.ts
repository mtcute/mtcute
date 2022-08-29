import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Set supergroup's slow mode interval.
 *
 * @param chatId  Chat ID or username
 * @param seconds
 *   Slow mode interval in seconds.
 *   Users will be able to send a message only once per this interval.
 *   Valid values are: `0 (off), 10, 30, 60 (1m), 300 (5m), 900 (15m) or 3600 (1h)`
 * @internal
 */
export async function setSlowMode(
    this: TelegramClient,
    chatId: InputPeerLike,
    seconds = 0
): Promise<void> {
    const res = await this.call({
        _: 'channels.toggleSlowMode',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        seconds,
    })
    this._handleUpdate(res)
}
