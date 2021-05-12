import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputPeer } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Unpin all pinned messages in a chat.
 *
 * @param chatId  Chat or user ID
 * @internal
 */
export async function unpinAllMessages(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<void> {
    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))

    const res = await this.call({
        _: 'messages.unpinAllMessages',
        peer
    })

    if (isInputPeerChannel(peer)) {
        this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
    } else {
        createDummyUpdate(res.pts, res.ptsCount)
    }
}
