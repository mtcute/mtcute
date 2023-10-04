import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputFileLike, InputStickerSet, normalizeInputStickerSet, StickerSet } from '../../types'

/**
 * Set sticker set thumbnail
 *
 * @param id  Sticker set short name or a TL object with input sticker set
 * @param thumb  Sticker set thumbnail
 * @param params
 * @returns  Modified sticker set
 * @internal
 */
export async function setStickerSetThumb(
    this: TelegramClient,
    id: InputStickerSet,
    thumb: InputFileLike | tl.TypeInputDocument,
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
    const res = await this.call({
        _: 'stickers.setStickerSetThumb',
        stickerset: normalizeInputStickerSet(id),
        thumb: await this._normalizeFileToDocument(thumb, params ?? {}),
    })

    return new StickerSet(this, res)
}
