import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete messages, including service messages.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 * @internal
 */
export async function deleteMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
    params?: {
        /**
         * Whether to "revoke" (i.e. delete for both sides).
         * Only used for chats and private chats.
         *
         * @default  true
         */
        revoke?: boolean
    },
): Promise<void> {
    const { revoke = true } = params ?? {}

    if (!Array.isArray(ids)) ids = [ids]

    const peer = await this.resolvePeer(chatId)

    let upd

    if (isInputPeerChannel(peer)) {
        const channel = normalizeToInputChannel(peer)
        const res = await this.call({
            _: 'channels.deleteMessages',
            channel,
            id: ids,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount, peer.channelId)
    } else {
        const res = await this.call({
            _: 'messages.deleteMessages',
            id: ids,
            revoke,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount)
    }

    this._handleUpdate(upd)
}
