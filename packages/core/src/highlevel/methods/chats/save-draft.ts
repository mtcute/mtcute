import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Save or delete a draft message associated with some chat
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param draft  Draft message, or `null` to delete.
 */
export async function saveDraft(
    client: ITelegramClient,
    chatId: InputPeerLike,
    draft: null | Omit<tl.RawDraftMessage, '_' | 'date'>,
): Promise<void> {
    const peer = await resolvePeer(client, chatId)

    if (draft) {
        await client.call({
            _: 'messages.saveDraft',
            peer,
            ...draft,
        })
    } else {
        await client.call({
            _: 'messages.saveDraft',
            peer,
            message: '',
        })
    }
}
