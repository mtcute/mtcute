import { TelegramClient } from '../../client'
import { tl } from '@mtqt/tl'

/**
 * Get list of folders.
 * @internal
 */
export async function getFolders(
    this: TelegramClient
): Promise<tl.RawDialogFilter[]> {
    return this.call({
        _: 'messages.getDialogFilters',
    })
}
