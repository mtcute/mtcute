import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputFileLike } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * @internal
 */
export async function _normalizeFileToDocument(
    this: TelegramClient,
    file: InputFileLike | tl.TypeInputDocument,
    params: {
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<tl.TypeInputDocument> {
    if (typeof file === 'object' && tl.isAnyInputDocument(file)) {
        return file
    }

    const media = await this._normalizeInputMedia(
        {
            type: 'document',
            file,
        },
        params,
        true,
    )

    assertTypeIs('createStickerSet', media, 'inputMediaDocument')
    assertTypeIs('createStickerSet', media.id, 'inputDocument')

    return media.id
}
