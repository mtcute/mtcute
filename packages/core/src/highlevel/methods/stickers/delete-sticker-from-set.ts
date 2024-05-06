import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { StickerSet } from '../../types/index.js'
import { fileIdToInputDocument } from '../../utils/convert-file-id.js'

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
    sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
): Promise<StickerSet> {
    if (tdFileId.isFileIdLike(sticker)) {
        sticker = fileIdToInputDocument(sticker)
    }

    const res = await client.call({
        _: 'stickers.removeStickerFromSet',
        sticker,
    })

    return new StickerSet(res)
}
