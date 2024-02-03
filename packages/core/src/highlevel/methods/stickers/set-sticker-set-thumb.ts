import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputFileLike, InputStickerSet, normalizeInputStickerSet, StickerSet } from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'

/**
 * Set sticker set thumbnail
 *
 * @param id  Sticker set short name or a TL object with input sticker set
 * @param thumb  Sticker set thumbnail
 * @param params
 * @returns  Modified sticker set
 */
export async function setStickerSetThumb(
    client: ITelegramClient,
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
    const res = await client.call({
        _: 'stickers.setStickerSetThumb',
        stickerset: normalizeInputStickerSet(id),
        thumb: await _normalizeFileToDocument(client, thumb, params ?? {}),
    })

    return new StickerSet(res)
}
