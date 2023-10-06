import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Mark chat history as read.
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function readHistory(
    this: TelegramClient,
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

    const peer = await this.resolvePeer(chatId)

    if (clearMentions) {
        const res = await this.call({
            _: 'messages.readMentions',
            peer,
        })

        if (isInputPeerChannel(peer)) {
            this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
        } else {
            this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
        }
    }

    if (isInputPeerChannel(peer)) {
        await this.call({
            _: 'channels.readHistory',
            channel: normalizeToInputChannel(peer),
            maxId,
        })
    } else {
        const res = await this.call({
            _: 'messages.readHistory',
            peer,
            maxId,
        })
        this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
