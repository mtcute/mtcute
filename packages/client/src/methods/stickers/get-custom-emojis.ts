import { BaseTelegramClient, MtTypeAssertionError, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { Sticker } from '../../types'
import { parseDocument } from '../../types/media/document-utils'

/**
 * Get custom emoji stickers by their IDs
 *
 * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
 */
export async function getCustomEmojis(client: BaseTelegramClient, ids: tl.Long[]): Promise<Sticker[]> {
    const res = await client.call({
        _: 'messages.getCustomEmojiDocuments',
        documentId: ids,
    })

    return res.map((it) => {
        assertTypeIs('getCustomEmojis', it, 'document')

        const doc = parseDocument(it)

        if (doc.type !== 'sticker') {
            throw new MtTypeAssertionError('getCustomEmojis', 'sticker', doc.type)
        }

        return doc
    })
}
