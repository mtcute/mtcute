import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { Dialog } from '../../types/messages/dialog.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'
import { getPeerDialogs } from './get-peer-dialogs.js'
import { iterDialogs } from './iter-dialogs.js'

// @available=user
/**
 * Try to find a dialog (dialogs) with a given peer (peers) by their ID, username or phone number.
 *
 * This might be an expensive call, as it will potentially iterate over all
 * dialogs to find the one with the given peer
 *
 * @throws {MtPeerNotFoundError}  If a dialog with any of the given peers was not found
 */
export async function findDialogs(client: ITelegramClient, peers: MaybeArray<string | number>): Promise<Dialog[]> {
    if (!Array.isArray(peers)) peers = [peers]
    const resolved = await resolvePeerMany(client, peers)

    // now we need to split `peers` into two parts: ids that we could resolve and those we couldn't
    // those that we couldn't we'll iterate over all dialogs and try to find them by username/id
    // those that we could we'll use getPeerDialogs

    // id -> idx
    const notFoundIds = new Map<number, number>()
    // username -> idx
    const notFoundUsernames = new Map<string, number>()
    let notFoundCount = 0

    const foundInputPeers: tl.TypeInputPeer[] = []
    const foundIdxToOriginalIdx = new Map<number, number>()

    for (let i = 0; i < peers.length; i++) {
        const input = peers[i]
        const resolvedPeer = resolved[i]

        if (!resolvedPeer) {
            if (typeof input === 'number') {
                notFoundIds.set(input, i)
            } else {
                notFoundUsernames.set(input, i)
            }

            notFoundCount += 1

            continue
        }

        foundInputPeers.push(resolvedPeer)
        foundIdxToOriginalIdx.set(foundInputPeers.length - 1, i)
    }

    const dialogs = await getPeerDialogs(client, foundInputPeers)

    if (foundInputPeers.length === peers.length) {
        return dialogs
    }

    const ret = new Array<Dialog>(peers.length)

    // populate found dialogs
    for (const [idx, origIdx] of foundIdxToOriginalIdx) {
        ret[origIdx] = dialogs[idx]
    }

    // now we need to iterate over all dialogs and try to find the rest
    for await (const dialog of iterDialogs(client, {
        archived: 'keep',
    })) {
        const chat = dialog.chat

        const idxById = notFoundIds.get(chat.id)

        if (idxById !== undefined) {
            ret[idxById] = dialog
            notFoundIds.delete(chat.id)
            notFoundCount -= 1
        }

        if (notFoundCount === 0) break

        if (!chat.username) continue

        const idxByUsername = notFoundUsernames.get(chat.username)

        if (idxByUsername !== undefined) {
            ret[idxByUsername] = dialog
            notFoundUsernames.delete(chat.username)
            notFoundCount -= 1
        }

        if (notFoundCount === 0) break
    }

    // if we still have some dialogs that we couldn't find, fail

    if (notFoundCount > 0) {
        const notFound = [...notFoundIds.keys(), ...notFoundUsernames.keys()]
        throw new MtPeerNotFoundError(`Could not find dialogs with peers: ${notFound.join(', ')}`)
    }

    return ret
}
