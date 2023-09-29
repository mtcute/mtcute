import { MtArgumentError, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputDialogFolder } from '../../types'

/**
 * Get list of folders.
 * @internal
 */
export async function getFolders(this: TelegramClient): Promise<tl.TypeDialogFilter[]> {
    return this.call({
        _: 'messages.getDialogFilters',
    })
}

/** @internal */
export async function _normalizeInputFolder(
    this: TelegramClient,
    folder: InputDialogFolder,
): Promise<tl.TypeDialogFilter> {
    if (typeof folder === 'string' || typeof folder === 'number') {
        const folders = await this.getFolders()
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
