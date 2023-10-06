import { MtArgumentError, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'

/**
 * Find a folder by its parameter.
 *
 * > **Note**: Searching by title and/or emoji might not be
 * > accurate since you can set the same title and/or emoji
 * > to multiple folders.
 *
 * @param params  Search parameters. At least one must be set.
 * @internal
 */
export async function findFolder(
    this: TelegramClient,
    params: {
        /** Folder title */
        title?: string
        /** Folder emoji */
        emoji?: string
        /** Folder ID */
        id?: number
    },
): Promise<tl.RawDialogFilter | null> {
    if (!params.title && !params.emoji && !params.id) {
        throw new MtArgumentError('One of search parameters must be passed')
    }

    const folders = await this.getFolders()

    return (
        (folders.find((it) => {
            if (it._ === 'dialogFilterDefault') return false
            if (params.id && it.id !== params.id) return false
            if (params.title && it.title !== params.title) return false
            if (params.emoji && it.emoticon !== params.emoji) return false

            return true
        }) as tl.RawDialogFilter) ?? null
    )
}
