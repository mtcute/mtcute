import { ITelegramClient } from '../../client.types.js'
import {
    InputStickerSet,
    InputStickerSetItem,
    normalizeInputStickerSet,
    StickerSet,
} from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'
import { _normalizeInputStickerSetItem } from './_utils.js'

/**
 * Add a sticker to a sticker set.
 *
 * For bots the sticker set must have been created by this bot.
 *
 * @param setId  Sticker set short name or TL object with input sticker set
 * @param sticker  Sticker to be added
 * @param params
 * @returns  Modfiied sticker set
 */
export async function addStickerToSet(
    client: ITelegramClient,
    setId: InputStickerSet,
    sticker: InputStickerSetItem,
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
        _: 'stickers.addStickerToSet',
        stickerset: normalizeInputStickerSet(setId),
        sticker: await _normalizeInputStickerSetItem(client, sticker, params),
    })

    return new StickerSet(res)
}
