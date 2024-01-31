import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Unarchive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 */
export async function unarchiveChats(client: ITelegramClient, chats: MaybeArray<InputPeerLike>): Promise<void> {
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
    client.handleClientUpdate(res)
}
