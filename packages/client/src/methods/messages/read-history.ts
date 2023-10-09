import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Mark chat history as read.
 *
 * @param chatId  Chat ID
 */
export async function readHistory(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Message up until which to read history
         *
         * @default  0, i.e. read everything
         */
        maxId?: number

        /**
         * Whether to also clear all mentions in the chat
         */
        clearMentions?: boolean
    },
): Promise<void> {
    const { maxId = 0, clearMentions } = params ?? {}

    const peer = await resolvePeer(client, chatId)

    if (clearMentions) {
        const res = await client.call({
            _: 'messages.readMentions',
            peer,
        })

        if (isInputPeerChannel(peer)) {
            client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
        } else {
            client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
        }
    }

    if (isInputPeerChannel(peer)) {
        await client.call({
            _: 'channels.readHistory',
            channel: normalizeToInputChannel(peer),
            maxId,
        })
    } else {
        const res = await client.call({
            _: 'messages.readHistory',
            peer,
            maxId,
        })
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
