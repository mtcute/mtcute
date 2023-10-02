import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Set whether a channel/supergroup has join-to-send setting enabled.
 *
 * This only affects discussion groups where users can send messages
 * without joining the group.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether join-to-send setting should be enabled
 * @internal
 */
export async function toggleJoinToSend(this: TelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await this.call({
        _: 'channels.toggleJoinToSend',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        enabled,
    })
    this._handleUpdate(res)
}
