import type { ITelegramClient } from '../../client.types.js'
import { assertTrue } from '../../../utils/type-assertions.js'

/**
 * Reorder folders
 *
 * @param order  New order of folders (folder IDs, where default = 0)
 */
export async function setFoldersOrder(client: ITelegramClient, order: number[]): Promise<void> {
    const r = await client.call({
        _: 'messages.updateDialogFiltersOrder',
        order,
    })

    assertTrue('messages.updateDialogFiltersOrder', r)
}
