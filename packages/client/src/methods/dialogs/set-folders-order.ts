import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

/**
 * Reorder folders
 *
 * @param order  New order of folders (folder IDs, where default = 0)
 */
export async function setFoldersOrder(client: BaseTelegramClient, order: number[]): Promise<void> {
    const r = await client.call({
        _: 'messages.updateDialogFiltersOrder',
        order,
    })

    assertTrue('messages.updateDialogFiltersOrder', r)
}
