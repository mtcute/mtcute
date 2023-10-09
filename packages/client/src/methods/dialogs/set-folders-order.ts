import { BaseTelegramClient } from '@mtcute/core'

/**
 * Reorder folders
 *
 * @param order  New order of folders (folder IDs, where default = 0)
 */
export async function setFoldersOrder(client: BaseTelegramClient, order: number[]): Promise<void> {
    await client.call({
        _: 'messages.updateDialogFiltersOrder',
        order,
    })
}
