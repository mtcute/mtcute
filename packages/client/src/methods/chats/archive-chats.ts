import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeerMany } from '../users/resolve-peer-many'

/**
 * Archive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 */
export async function archiveChats(client: BaseTelegramClient, chats: MaybeArray<InputPeerLike>): Promise<void> {
    if (!Array.isArray(chats)) chats = [chats]

    const resolvedPeers = await resolvePeerMany(client, chats)

    const updates = await client.call({
        _: 'folders.editPeerFolders',
        folderPeers: resolvedPeers.map((peer) => ({
            _: 'inputFolderPeer',
            peer,
            folderId: 1,
        })),
    })
    client.network.handleUpdate(updates)
}
