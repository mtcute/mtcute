import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { MtCuteArgumentError } from '../../types'

/**
 * Edit a folder with given modification
 *
 * @param folder
 *     Folder, folder ID or name.
 *     Note that passing an ID or name will require re-fetching all folders,
 *     and passing name might affect not the right folder if you have multiple
 *     with the same name.
 * @param modification  Modification that will be applied to this folder
 * @returns  Modified folder
 * @internal
 */
export async function editFolder(
    this: TelegramClient,
    folder: tl.RawDialogFilter | number | string,
    modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>
): Promise<tl.RawDialogFilter> {
    if (typeof folder === 'number' || typeof folder === 'string') {
        const old = await this.getFolders()
        const found = old.find((it) => it.id === folder || it.title === folder)
        if (!found)
            throw new MtCuteArgumentError(`Could not find a folder ${folder}`)

        folder = found
    }

    const filter: tl.RawDialogFilter = {
        ...folder,
        ...modification,
    }

    await this.call({
        _: 'messages.updateDialogFilter',
        id: folder.id,
        filter,
    })

    return filter
}
