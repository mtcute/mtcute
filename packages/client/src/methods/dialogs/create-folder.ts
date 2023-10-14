import { BaseTelegramClient, PartialExcept, tl } from '@mtcute/core'

import { getFolders } from './get-folders.js'

/**
 * Create a folder from given parameters
 *
 * ID for the folder is optional, if not
 * provided it will be derived automatically.
 *
 * @param folder  Parameters for the folder
 * @returns  Newly created folder
 */
export async function createFolder(
    client: BaseTelegramClient,
    folder: PartialExcept<tl.RawDialogFilter, 'title'>,
): Promise<tl.RawDialogFilter> {
    let id = folder.id

    if (!id) {
        const old = await getFolders(client)

        // determine next id by finding max id
        // thanks durov for awesome api
        let max = 1
        old.forEach((it) => {
            if (it._ === 'dialogFilter' && it.id > max) max = it.id
        })
        id = max + 1
    }

    const filter: tl.RawDialogFilter = {
        _: 'dialogFilter',
        pinnedPeers: [],
        includePeers: [],
        excludePeers: [],
        ...folder,
        id,
    }

    await client.call({
        _: 'messages.updateDialogFilter',
        id,
        filter,
    })

    return filter
}
