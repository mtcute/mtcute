import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import { InputPeerLike } from '../../types'
import { tl } from '@mtcute/tl'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Unarchive one or more chats
 *
 * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
 * @internal
 */
export async function unarchiveChats(
    this: TelegramClient,
    chats: MaybeArray<InputPeerLike>
): Promise<void> {
    if (!Array.isArray(chats)) chats = [chats]

    const folderPeers: tl.TypeInputFolderPeer[] = []

    for (const chat of chats) {
        folderPeers.push({
            _: 'inputFolderPeer',
            peer: normalizeToInputPeer(await this.resolvePeer(chat)),
            folderId: 0
        })
    }

    const res = await this.call({
        _: 'folders.editPeerFolders',
        folderPeers
    })
    this._handleUpdate(res)
}
