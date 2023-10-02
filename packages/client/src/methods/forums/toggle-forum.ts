import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Set whether a supergroup is a forum.
 *
 * Only owner of the supergroup can change this setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether the supergroup should be a forum
 * @internal
 */
export async function toggleForum(this: TelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await this.call({
        _: 'channels.toggleForum',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        enabled,
    })
    this._handleUpdate(res)
}
