import { TelegramClient } from '../../client'

/**
 * Reorder folders
 *
 * @param order  New order of folders (folder IDs, where default = 0)
 * @internal
 */
export async function setFoldersOrder(this: TelegramClient, order: number[]): Promise<void> {
    await this.call({
        _: 'messages.updateDialogFiltersOrder',
        order,
    })
}
