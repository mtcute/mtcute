import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputStickerSetItem, MASK_POSITION_POINT_TO_TL } from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'

/**
 * @internal
 * @noemit
 */
export async function _normalizeInputStickerSetItem(
    client: ITelegramClient,
    sticker: InputStickerSetItem,
    params?: {
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<tl.TypeInputStickerSetItem> {
    return {
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
    }
}
