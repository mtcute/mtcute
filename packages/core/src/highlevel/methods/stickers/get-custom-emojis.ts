import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { MaybeArray } from '../../../types/utils.js'
import { LongSet } from '../../../utils/long-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message, Sticker } from '../../types/index.js'
import { parseDocument } from '../../types/media/document-utils.js'

/**
 * Get custom emoji stickers by their IDs
 *
 * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
 */
export async function getCustomEmojis(client: ITelegramClient, ids: tl.Long[]): Promise<Sticker[]> {
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

/**
 * Given one or more messages, extract all unique custom emojis from it and fetch them
 */
export async function getCustomEmojisFromMessages(
    client: ITelegramClient,
    messages: MaybeArray<Message>,
): Promise<Sticker[]> {
    const set = new LongSet()

    if (!Array.isArray(messages)) messages = [messages]

    for (const { raw } of messages) {
        if (raw._ === 'messageService' || !raw.entities) continue

        for (const entity of raw.entities) {
            if (entity._ === 'messageEntityCustomEmoji') {
                set.add(entity.documentId)
            }
        }
    }

    const arr = set.toArray()
    if (!arr.length) return []

    return getCustomEmojis(client, arr)
}
