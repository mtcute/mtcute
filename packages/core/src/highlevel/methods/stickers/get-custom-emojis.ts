import type { tl } from '../../../tl/index.js'

import type { MaybeArray } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'
import type { Message, Sticker } from '../../types/index.js'
import { isNotNull } from '@fuman/utils'
import { LongSet } from '../../../utils/long-utils.js'
import { parseDocument } from '../../types/media/document-utils.js'

/**
 * Get custom emoji stickers by their IDs, or `null` if not available/found.
 *
 * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
 */
export async function getCustomEmojis(client: ITelegramClient, ids: tl.Long[]): Promise<(Sticker | null)[]> {
  const res = await client.call({
    _: 'messages.getCustomEmojiDocuments',
    documentId: ids,
  })

  return res.map((it) => {
    if (it._ !== 'document') return null

    const doc = parseDocument(it)

    if (doc.type !== 'sticker') {
      return null
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

  const arr = [...set]
  if (!arr.length) return []

  return getCustomEmojis(client, arr).then(res => res.filter(isNotNull))
}
