import type { tl } from '@mtcute/tl'
import type { MaybeArray } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/index.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { Dialog } from '../../types/messages/dialog.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 */
export async function getPeerDialogs(
  client: ITelegramClient,
  peers: MaybeArray<InputPeerLike>,
): Promise<(Dialog | null)[]> {
  if (!Array.isArray(peers)) {
    let peer: tl.TypeInputPeer
    try {
      peer = await resolvePeer(client, peers)
    } catch (e) {
      if (e instanceof MtPeerNotFoundError) {
        return [null]
      }
      throw e
    }

    const res = await client.call({
      _: 'messages.getPeerDialogs',
      peers: [
        {
          _: 'inputDialogPeer',
          peer,
        },
      ],
    })

    return Dialog.parseTlDialogs(res)
  }

  const resolved = await resolvePeerMany(client, peers)

  const dialogPeers: tl.TypeInputDialogPeer[] = []
  const result: (Dialog | null)[] = []
  const peerToIdx = new Map<number, number>()
  for (let i = 0; i < resolved.length; i++) {
    result[i] = null

    const peer = resolved[i]
    if (!peer || peer._ === 'inputPeerEmpty') {
      continue
    }

    dialogPeers.push({
      _: 'inputDialogPeer',
      peer,
    })
    peerToIdx.set(getMarkedPeerId(peer), i)
  }

  const dialogs = Dialog.parseTlDialogs(await client.call({
    _: 'messages.getPeerDialogs',
    peers: dialogPeers,
  }))

  for (const dialog of dialogs) {
    const peerIdx = peerToIdx.get(dialog.peer.id)
    if (peerIdx === undefined) continue // wtf?
    result[peerIdx] = dialog
  }

  return result
}
