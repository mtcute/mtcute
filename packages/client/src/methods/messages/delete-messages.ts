import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Delete messages, including service messages.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 */
export async function deleteMessages(
    client: BaseTelegramClient,
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

    const peer = await resolvePeer(client, chatId)

    let upd

    if (isInputPeerChannel(peer)) {
        const channel = normalizeToInputChannel(peer)
        const res = await client.call({
            _: 'channels.deleteMessages',
            channel,
            id: ids,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount, peer.channelId)
    } else {
        const res = await client.call({
            _: 'messages.deleteMessages',
            id: ids,
            revoke,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount)
    }

    client.network.handleUpdate(upd)
}
