import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { PeersIndex } from '../../types/peers/peers-index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getRawPeerBatched } from './batched-queries.js'

/**
 * Build a {@link PeersIndex} for the given peers, using the local storage
 * and falling back to fetching them from the server.
 *
 * Useful for responses that reference peers without including them.
 *
 * @internal
 * @noemit
 */
export async function _buildPeersIndex(
  client: ITelegramClient,
  peersToFetch: (tl.TypePeer | tl.TypeInputPeer)[],
): Promise<PeersIndex> {
  const peers = new PeersIndex()

  await Promise.all(peersToFetch.map(async (peer) => {
    const id = getMarkedPeerId(peer)

    let cached = await client.storage.peers.getCompleteById(id)

    if (!cached) {
      cached = await _getRawPeerBatched(client, await resolvePeer(client, peer))
    }

    if (!cached) {
      throw new MtPeerNotFoundError(`Peer ${id} not found`)
    }

    switch (cached._) {
      case 'user':
        peers.users.set(cached.id, cached)
        break
      case 'chat':
      case 'chatForbidden':
      case 'channel':
      case 'channelForbidden':
        peers.chats.set(cached.id, cached)
        break
      default:
        throw new MtTypeAssertionError(
          'user | chat | channel', // not very accurate, but good enough
          cached._,
        )
    }
  }))

  return peers
}
