import { BaseTelegramClient } from '@mtcute/core'

import {
    InputStickerSet,
    InputStickerSetItem,
    MASK_POSITION_POINT_TO_TL,
    normalizeInputStickerSet,
    StickerSet,
} from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'

/**
 * Add a sticker to a sticker set.
 *
 * Only for bots, and the sticker set must
 * have been created by this bot.
 *
 * @param setId  Sticker set short name or TL object with input sticker set
 * @param sticker  Sticker to be added
 * @param params
 * @returns  Modfiied sticker set
 */
export async function addStickerToSet(
    client: BaseTelegramClient,
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
        sticker: {
            _: 'inputStickerSetItem',
            document: await _normalizeFileToDocument(client, sticker.file, params ?? {}),
            emoji: sticker.emojis,
            maskCoords: sticker.maskPosition ?
                {
                    _: 'maskCoords',
                    n: MASK_POSITION_POINT_TO_TL[sticker.maskPosition.point],
                    x: sticker.maskPosition.x,
                    y: sticker.maskPosition.y,
                    zoom: sticker.maskPosition.scale,
                } :
                undefined,
        },
    })

    return new StickerSet(res)
}
