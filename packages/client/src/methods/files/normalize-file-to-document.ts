import { TelegramClient } from '../../client'
import { InputFileLike } from '../../types'
import { tl } from '@mtcute/tl'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * @internal
 */
export async function _normalizeFileToDocument(
    this: TelegramClient,
    file: InputFileLike,
    params: {
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<tl.TypeInputDocument> {
    const media = await this._normalizeInputMedia({
        type: 'document',
        file,
    }, params, true)

    assertTypeIs('createStickerSet', media, 'inputMediaDocument')
    assertTypeIs('createStickerSet', media.id, 'inputDocument')

    return media.id
}
