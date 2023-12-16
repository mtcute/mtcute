import { BaseTelegramClient, tl } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

/**
 * Delete a folder by its ID
 *
 * @param id  Folder ID or folder itself
 */
export async function deleteFolder(client: BaseTelegramClient, id: number | tl.RawDialogFilter): Promise<void> {
    const r = await client.call({
        _: 'messages.updateDialogFilter',
        id: typeof id === 'number' ? id : id.id,
    })

    assertTrue('messages.updateDialogFilter', r)
}
