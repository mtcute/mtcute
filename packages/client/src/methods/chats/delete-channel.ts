import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

// @alias=deleteSupergroup
/**
 * Delete a channel or a supergroup
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function deleteChannel(this: TelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await this.call({
        _: 'channels.deleteChannel',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
    })
    this._handleUpdate(res)
}
