import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'

import { getFolders } from './get-folders'

/**
 * Edit a folder with given modification
 *
 * @returns  Modified folder
 */
export async function editFolder(
    client: BaseTelegramClient,
    params: {
        /**
         * Folder, folder ID or name.
         * Note that passing an ID or name will require re-fetching all folders,
         * and passing name might affect not the right folder if you have multiple
         * with the same name.
         */
        folder: tl.RawDialogFilter | number | string

        /** Modification to be applied to this folder */
        modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>
    },
): Promise<tl.RawDialogFilter> {
    const { modification } = params
    let { folder } = params

    if (folder === 0) {
        throw new MtArgumentError('Cannot modify default folder')
    }
    if (typeof folder === 'number' || typeof folder === 'string') {
        const old = await getFolders(client)
        const found = old.find((it) => it._ === 'dialogFilter' && (it.id === folder || it.title === folder))

        if (!found) {
            throw new MtArgumentError(`Could not find a folder ${folder}`)
        }

        folder = found as tl.RawDialogFilter
    }

    const filter: tl.RawDialogFilter = {
        ...folder,
        ...modification,
    }

    await client.call({
        _: 'messages.updateDialogFilter',
        id: folder.id,
        filter,
    })

    return filter
}
