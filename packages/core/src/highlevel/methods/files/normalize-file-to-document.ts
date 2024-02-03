import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputFileLike } from '../../types/index.js'
import { _normalizeInputMedia } from './normalize-input-media.js'

/**
 * @internal
 */
export async function _normalizeFileToDocument(
    client: ITelegramClient,
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
