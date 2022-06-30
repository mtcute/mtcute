import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'

/**
 * Delete a folder by its ID
 *
 * @param id  Folder ID or folder itself
 * @internal
 */
export async function deleteFolder(
    this: TelegramClient,
    id: number | tl.RawDialogFilter
): Promise<void> {
    await this.call({
        _: 'messages.updateDialogFilter',
        id: typeof id === 'number' ? id : id.id,
    })
}
