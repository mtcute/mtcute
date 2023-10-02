import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Set whether a channel/supergroup has join requests enabled.
 *
 * > **Note**: this method only affects primary invite links.
 * > Additional invite links may exist with the opposite setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether join requests should be enabled
 * @internal
 */
export async function toggleJoinRequests(this: TelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await this.call({
        _: 'channels.toggleJoinRequest',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        enabled,
    })
    this._handleUpdate(res)
}
