import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { tl } from '@mtcute/tl'

/**
 * Save or delete a draft message associated with some chat
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param draft  Draft message, or `null` to delete.
 * @internal
 */
export async function saveDraft(
    this: TelegramClient,
    chatId: InputPeerLike,
    draft: null | Omit<tl.RawDraftMessage, '_' | 'date'>
): Promise<void> {
    const peer = await this.resolvePeer(chatId)

    if (draft) {
        await this.call({
            _: 'messages.saveDraft',
            peer,
            ...draft
        })
    } else {
        await this.call({
            _: 'messages.saveDraft',
            peer,
            message: ''
        })
    }
}
