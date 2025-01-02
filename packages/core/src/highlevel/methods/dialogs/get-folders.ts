import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputDialogFolder } from '../../types/index.js'
import { MtArgumentError } from '../../../types/errors.js'

/**
 * Get list of folders.
 */
export async function getFolders(client: ITelegramClient): Promise<tl.messages.RawDialogFilters> {
    return client.call({
        _: 'messages.getDialogFilters',
    })
}

/** @internal */
export async function _normalizeInputFolder(
    client: ITelegramClient,
    folder: InputDialogFolder,
): Promise<tl.TypeDialogFilter> {
    if (typeof folder === 'string' || typeof folder === 'number') {
        const folders = await getFolders(client)
        const found = folders.filters.find((it) => {
            if (it._ === 'dialogFilterDefault') {
                return folder === 0
            }

            return it.id === folder || it.title.text === folder
        })

        if (!found) {
            throw new MtArgumentError(`Could not find folder ${folder}`)
        }

        return found
    }

    return folder
}
