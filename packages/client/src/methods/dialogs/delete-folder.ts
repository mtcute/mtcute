import { BaseTelegramClient, tl } from '@mtcute/core'

/**
 * Delete a folder by its ID
 *
 * @param id  Folder ID or folder itself
 */
export async function deleteFolder(client: BaseTelegramClient, id: number | tl.RawDialogFilter): Promise<void> {
    await client.call({
        _: 'messages.updateDialogFilter',
        id: typeof id === 'number' ? id : id.id,
    })
}
