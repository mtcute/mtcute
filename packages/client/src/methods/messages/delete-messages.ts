import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { MaybeArray } from '@mtcute/core'
import { normalizeToInputChannel, normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Delete messages, including service messages.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 * @param revoke  Whether to "revoke" (i.e. delete for both sides). Only used for chats and private chats.
 * @internal
 */
export async function deleteMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
    revoke = true
): Promise<boolean> {
    if (!Array.isArray(ids)) ids = [ids]

    const peer = await this.resolvePeer(chatId)
    const inputPeer = normalizeToInputPeer(peer)

    let res
    if (inputPeer._ === 'inputPeerChannel') {
        res = await this.call({
            _: 'channels.deleteMessages',
            channel: normalizeToInputChannel(peer)!,
            id: ids
        })
    } else {
        res = await this.call({
            _: 'messages.deleteMessages',
            id: ids,
            revoke
        })
    }

    return !!res.ptsCount
}
