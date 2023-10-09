import { BaseTelegramClient, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { InputFileLike } from '../../types'
import { _normalizeInputMedia } from './normalize-input-media'

/**
 * @internal
 */
export async function _normalizeFileToDocument(
    client: BaseTelegramClient,
    file: InputFileLike | tl.TypeInputDocument,
    params: {
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<tl.TypeInputDocument> {
    if (typeof file === 'object' && tl.isAnyInputDocument(file)) {
        return file
    }

    const media = await _normalizeInputMedia(
        client,
        {
            type: 'document',
            file,
        },
        params,
        true,
    )

    assertTypeIs('_normalizeFileToDocument', media, 'inputMediaDocument')
    assertTypeIs('_normalizeFileToDocument', media.id, 'inputDocument')

    return media.id
}
