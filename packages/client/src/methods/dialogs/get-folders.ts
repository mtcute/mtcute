import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'

/**
 * Get list of folders.
 * @internal
 */
export async function getFolders(
    this: TelegramClient
): Promise<tl.TypeDialogFilter[]> {
    return this.call({
        _: 'messages.getDialogFilters',
    })
}
