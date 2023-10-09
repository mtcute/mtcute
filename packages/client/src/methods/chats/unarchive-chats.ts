import { BaseTelegramClient, MaybeArray, tl } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Unarchive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 */
export async function unarchiveChats(client: BaseTelegramClient, chats: MaybeArray<InputPeerLike>): Promise<void> {
    if (!Array.isArray(chats)) chats = [chats]

    const folderPeers: tl.TypeInputFolderPeer[] = []

    for (const chat of chats) {
        folderPeers.push({
            _: 'inputFolderPeer',
            peer: await resolvePeer(client, chat),
            folderId: 0,
        })
    }

    const res = await client.call({
        _: 'folders.editPeerFolders',
        folderPeers,
    })
    client.network.handleUpdate(res)
}
