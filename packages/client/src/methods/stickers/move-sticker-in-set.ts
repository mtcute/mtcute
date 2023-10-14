import { BaseTelegramClient, tl } from '@mtcute/core'
import { fileIdToInputDocument, tdFileId } from '@mtcute/file-id'

import { StickerSet } from '../../types/index.js'

/**
 * Move a sticker in a sticker set
 * to another position
 *
 * Only for bots, and the sticker set must
 * have been created by this bot.
 *
 * @param sticker
 *     TDLib and Bot API compatible File ID, or a
 *     TL object representing a sticker to be removed
 * @param position  New sticker position (starting from 0)
 * @returns  Modfiied sticker set
 */

export async function moveStickerInSet(
    client: BaseTelegramClient,
    sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
    position: number,
): Promise<StickerSet> {
    if (tdFileId.isFileIdLike(sticker)) {
        sticker = fileIdToInputDocument(sticker)
    }

    const res = await client.call({
        _: 'stickers.changeStickerPosition',
        sticker,
        position,
    })

    return new StickerSet(res)
}
