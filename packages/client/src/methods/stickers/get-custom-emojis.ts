import { MtTypeAssertionError } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Sticker } from '../../types'
import { parseDocument } from '../../types/media/document-utils'

/**
 * Get custom emoji stickers by their IDs
 *
 * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
 * @internal
 */
export async function getCustomEmojis(this: TelegramClient, ids: tl.Long[]): Promise<Sticker[]> {
    const res = await this.call({
        _: 'messages.getCustomEmojiDocuments',
        documentId: ids,
    })

    return res.map((it) => {
        assertTypeIs('getCustomEmojis', it, 'document')

        const doc = parseDocument(this, it)

        if (doc.type !== 'sticker') {
            throw new MtTypeAssertionError('getCustomEmojis', 'sticker', doc.type)
        }

        return doc
    })
}
