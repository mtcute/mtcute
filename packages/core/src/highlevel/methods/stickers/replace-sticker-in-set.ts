import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputStickerSetItem, StickerSet } from '../../types/index.js'
import { fileIdToInputDocument } from '../../utils/convert-file-id.js'
import { _normalizeInputStickerSetItem } from './_utils.js'

// @available=both
/**
 * Replace a sticker in a sticker set with another sticker
 *
 * For bots the sticker set must have been created by this bot.
 *
 * @param sticker
 *     TDLib and Bot API compatible File ID, or a
 *     TL object representing a sticker to be removed
 * @param newSticker  New sticker to replace the old one with
 * @returns  Modfiied sticker set
 */
export async function replaceStickerInSet(
    client: ITelegramClient,
    sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
    newSticker: InputStickerSetItem,
    params?: {
        /**
         * Upload progress callback
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<StickerSet> {
    if (tdFileId.isFileIdLike(sticker)) {
        sticker = fileIdToInputDocument(sticker)
    }

    const res = await client.call({
        _: 'stickers.replaceSticker',
        sticker,
        newSticker: await _normalizeInputStickerSetItem(client, newSticker, params),
    })

    return new StickerSet(res)
}
