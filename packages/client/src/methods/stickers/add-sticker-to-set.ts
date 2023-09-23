import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputStickerSetItem, StickerSet } from '../../types'

const MASK_POS = {
    forehead: 0,
    eyes: 1,
    mouth: 2,
    chin: 3,
} as const

/**
 * Add a sticker to a sticker set.
 *
 * Only for bots, and the sticker set must
 * have been created by this bot.
 *
 * @param id  Sticker set short name or TL object with input sticker set
 * @param sticker  Sticker to be added
 * @param params
 * @returns  Modfiied sticker set
 * @internal
 */
export async function addStickerToSet(
    this: TelegramClient,
    id: string | tl.TypeInputStickerSet,
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
    if (typeof id === 'string') {
        id = {
            _: 'inputStickerSetShortName',
            shortName: id,
        }
    }

    const res = await this.call({
        _: 'stickers.addStickerToSet',
        stickerset: id,
        sticker: {
            _: 'inputStickerSetItem',
            document: await this._normalizeFileToDocument(sticker.file, params ?? {}),
            emoji: sticker.emojis,
            maskCoords: sticker.maskPosition ?
                {
                    _: 'maskCoords',
                    n: MASK_POS[sticker.maskPosition.point],
                    x: sticker.maskPosition.x,
                    y: sticker.maskPosition.y,
                    zoom: sticker.maskPosition.scale,
                } :
                undefined,
        },
    })

    return new StickerSet(this, res)
}
