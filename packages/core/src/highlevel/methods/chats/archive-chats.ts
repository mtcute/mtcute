import { MaybeArray } from '../../../types/utils.js'
import { isPresent } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Archive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 */
export async function archiveChats(client: ITelegramClient, chats: MaybeArray<InputPeerLike>): Promise<void> {
    if (!Array.isArray(chats)) chats = [chats]

    const resolvedPeers = await resolvePeerMany(client, chats)

    const updates = await client.call({
        _: 'folders.editPeerFolders',
        folderPeers: resolvedPeers.filter(isPresent).map((peer) => ({
            _: 'inputFolderPeer',
            peer,
            folderId: 1,
        })),
    })
    client.handleClientUpdate(updates)
}
