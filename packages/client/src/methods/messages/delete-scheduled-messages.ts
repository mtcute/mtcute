import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { MaybeArray } from '@mtcute/core'
import {
    isInputPeerChannel,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'

/**
 * Delete scheduled messages.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 * @internal
 */
export async function deleteScheduledMessages(
    this: TelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<void> {
    if (!Array.isArray(ids)) ids = [ids]

    const peer = await this.resolvePeer(chatId)

    const res = await this.call({
        _: 'messages.deleteScheduledMessages',
        peer,
        id: ids
    })

    this._handleUpdate(res)
}
