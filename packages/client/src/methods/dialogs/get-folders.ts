import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'

import { InputDialogFolder } from '../../types'

/**
 * Get list of folders.
 */
export async function getFolders(client: BaseTelegramClient): Promise<tl.TypeDialogFilter[]> {
    return client.call({
        _: 'messages.getDialogFilters',
    })
}

/** @internal */
export async function _normalizeInputFolder(
    client: BaseTelegramClient,
    folder: InputDialogFolder,
): Promise<tl.TypeDialogFilter> {
    if (typeof folder === 'string' || typeof folder === 'number') {
        const folders = await getFolders(client)
        const found = folders.find((it) => {
            if (it._ === 'dialogFilterDefault') {
                return folder === 0
            }

            return it.id === folder || it.title === folder
        })

        if (!found) {
            throw new MtArgumentError(`Could not find folder ${folder}`)
        }

        return found
    }

    return folder
}
