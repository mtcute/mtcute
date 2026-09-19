import type { ITelegramClient } from '../../client.types.js'

import type { InputDocumentId } from '../../types/index.js'
import { StickerSet } from '../../types/index.js'
import { _normalizeInputDocumentId } from '../files/normalize-file-to-document.js'

/**
 * Delete a sticker from a sticker set
 *
 * For bots the sticker set must have been created by this bot.
 *
 * @param sticker
 *     TDLib and Bot API compatible File ID, or a
 *     TL object representing a sticker to be removed
 * @returns  Modfiied sticker set
 */
export async function deleteStickerFromSet(
  client: ITelegramClient,
  sticker: InputDocumentId,
): Promise<StickerSet> {
  const res = await client.call({
    _: 'stickers.removeStickerFromSet',
    sticker: _normalizeInputDocumentId(sticker),
  })

  return new StickerSet(res)
}
