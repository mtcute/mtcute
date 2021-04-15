import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { MtCuteArgumentError } from '../../types'

/**
 * Edit a folder with given modification
 *
 * @param folder  Folder or folder ID. Note that passing an ID will require re-fetching all folders
 * @param modification  Modification that will be applied to this folder
 * @returns  Modified folder
 * @internal
 */
export async function editFolder(
    this: TelegramClient,
    folder: tl.RawDialogFilter | number,
    modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>
): Promise<tl.RawDialogFilter> {
    if (typeof folder === 'number') {
        const old = await this.getFolders()
        const found = old.find(it => it.id === folder)
        if (!found) throw new MtCuteArgumentError(`Could not find a folder with ID ${folder}`)

        folder = found
    }

    const filter: tl.RawDialogFilter = {
        ...folder,
        ...modification
    }

    await this.call({
        _: 'messages.updateDialogFilter',
        id: folder.id,
        filter
    })

    return filter
}
