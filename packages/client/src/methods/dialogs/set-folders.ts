import { TelegramClient } from '../../client'

/**
 * Reorder folders
 *
 * Order is folder's ID (0 = default folder)
 *
 * @internal
 */
export async function setFoldersOrder(
    this: TelegramClient,
    order: number[],
): Promise<void> {
    await this.call({
        _: 'messages.updateDialogFiltersOrder',
        order,
    })
}
