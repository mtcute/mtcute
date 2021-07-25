import { InputPeerLike, MtqtInvalidPeerTypeError } from '../../types'
import { TelegramClient } from '../../client'
import { normalizeToInputChannel } from '../../utils/peer-utils'

// @alias=deleteSupergroup
/**
 * Delete a channel or a supergroup
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function deleteChannel(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<void> {
    const peer = normalizeToInputChannel(await this.resolvePeer(chatId))
    if (!peer) throw new MtqtInvalidPeerTypeError(chatId, 'channel')

    const res = await this.call({
        _: 'channels.deleteChannel',
        channel: peer,
    })
    this._handleUpdate(res)
}
