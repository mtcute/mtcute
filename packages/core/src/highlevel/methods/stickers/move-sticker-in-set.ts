import type { ITelegramClient } from '../../client.types.js'

import type { InputDocumentId } from '../../types/index.js'
import { StickerSet } from '../../types/index.js'
import { _normalizeInputDocumentId } from '../files/normalize-file-to-document.js'

/**
 * Move a sticker in a sticker set
 * to another position
 *
 * For bots the sticker set must have been created by this bot.
 *
 * @param sticker
 *     TDLib and Bot API compatible File ID, or a
 *     TL object representing a sticker to be removed
 * @param position  New sticker position (starting from 0)
 * @returns  Modified sticker set
 */
export async function moveStickerInSet(
  client: ITelegramClient,
  sticker: InputDocumentId,
  position: number,
): Promise<StickerSet> {
  const res = await client.call({
    _: 'stickers.changeStickerPosition',
    sticker: _normalizeInputDocumentId(sticker),
    position,
  })

  return new StickerSet(res)
}
