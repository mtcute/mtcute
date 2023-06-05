import { fileIdToInputDocument, tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { StickerSet } from '../../types'

/**
 * Delete a sticker from a sticker set
 *
 * Only for bots, and the sticker set must
 * have been created by this bot.
 *
 * @param sticker
 *     TDLib and Bot API compatible File ID, or a
 *     TL object representing a sticker to be removed
 * @returns  Modfiied sticker set
 * @internal
 */
export async function deleteStickerFromSet(
    this: TelegramClient,
    sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
): Promise<StickerSet> {
    if (tdFileId.isFileIdLike(sticker)) {
        sticker = fileIdToInputDocument(sticker)
    }

    const res = await this.call({
        _: 'stickers.removeStickerFromSet',
        sticker,
    })

    return new StickerSet(this, res)
}
