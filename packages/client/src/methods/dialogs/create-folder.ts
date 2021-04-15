import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { PartialExcept } from '@mtcute/core'

/**
 * Create a folder from given parameters
 *
 * ID for the folder is optional, if not
 * provided it will be derived automatically.
 *
 * @param folder  Parameters for the folder
 * @returns  Newly created folder
 * @internal
 */
export async function createFolder(
    this: TelegramClient,
    folder: PartialExcept<tl.RawDialogFilter, 'title'>
): Promise<tl.RawDialogFilter> {
    let id = folder.id

    if (!id) {
        const old = await this.getFolders()

        // determine next id by finding max id
        // thanks durov for awesome api
        let max = 0
        old.forEach((it) => {
            if (it.id > max) max = it.id
        })
        id = max + 1
    }

    const filter: tl.RawDialogFilter = {
        _: 'dialogFilter',
        pinnedPeers: [],
        includePeers: [],
        excludePeers: [],
        ...folder,
        id
    }

    await this.call({
        _: 'messages.updateDialogFilter',
        id,
        filter
    })

    return filter
}
