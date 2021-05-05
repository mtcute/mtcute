import { TelegramClient } from '../../client'
import { fileIdToInputDocument, tdFileId } from '../../../../file-id'
import { tl } from '@mtcute/tl'
import { StickerSet } from '../../types'

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
 * @internal
 */

export async function moveStickerInSet(
    this: TelegramClient,
    sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
    position: number
): Promise<StickerSet> {
    if (tdFileId.isFileIdLike(sticker)) {
        sticker = fileIdToInputDocument(sticker)
    }

    const res = await this.call({
        _: 'stickers.changeStickerPosition',
        sticker,
        position
    })

    return new StickerSet(this, res)
}
