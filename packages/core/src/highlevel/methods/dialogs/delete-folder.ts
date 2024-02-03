import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Delete a folder by its ID
 *
 * @param id  Folder ID or folder itself
 */
export async function deleteFolder(client: ITelegramClient, id: number | tl.RawDialogFilter): Promise<void> {
    const r = await client.call({
        _: 'messages.updateDialogFilter',
        id: typeof id === 'number' ? id : id.id,
    })

    assertTrue('messages.updateDialogFilter', r)
}
