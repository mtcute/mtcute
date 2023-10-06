import { MaybeArray } from '@mtcute/core'

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

    const resolvedPeers = await this.resolvePeerMany(chats)

    const updates = await this.call({
        _: 'folders.editPeerFolders',
        folderPeers: resolvedPeers.map((peer) => ({
            _: 'inputFolderPeer',
            peer,
            folderId: 1,
        })),
    })
    this._handleUpdate(updates)
}
