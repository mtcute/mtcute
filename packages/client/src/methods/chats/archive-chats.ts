import { MaybeArray, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Archive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 * @internal
 */
export async function archiveChats(this: TelegramClient, chats: MaybeArray<InputPeerLike>): Promise<void> {
    if (!Array.isArray(chats)) chats = [chats]

    const folderPeers: tl.TypeInputFolderPeer[] = []

    for (const chat of chats) {
        folderPeers.push({
            _: 'inputFolderPeer',
            peer: await this.resolvePeer(chat),
            folderId: 1,
        })
    }

    const updates = await this.call({
        _: 'folders.editPeerFolders',
        folderPeers,
    })
    this._handleUpdate(updates)
}
