import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import {
    isInputPeerChannel,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Mark chat history as read.
 *
 * @param chatId  Chat ID
 * @param message  Message up until which to read history (by default everything is read)
 * @param clearMentions  Whether to also clear all mentions in the chat
 * @internal
 */
export async function readHistory(
    this: TelegramClient,
    chatId: InputPeerLike,
    message = 0,
    clearMentions = false
): Promise<void> {
    const peer = await this.resolvePeer(chatId)

    if (clearMentions) {
        const res = await this.call({
            _: 'messages.readMentions',
            peer,
        })

        if (isInputPeerChannel(peer)) {
            this._handleUpdate(
                createDummyUpdate(res.pts, res.ptsCount, peer.channelId)
            )
        } else {
            this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
        }
    }

    if (isInputPeerChannel(peer)) {
        await this.call({
            _: 'channels.readHistory',
            channel: normalizeToInputChannel(peer),
            maxId: message,
        })
    } else {
        const res = await this.call({
            _: 'messages.readHistory',
            peer,
            maxId: message,
        })
        this._handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
