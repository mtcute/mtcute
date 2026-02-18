import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, Peer } from '../../types/index.js'
import { parsePeer } from '../../types/index.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

import { _getRawPeerBatched } from './batched-queries.js'

// @available=both
/**
 * Get basic information about multiple peers.
 *
 * @param chatIds  Chat identifiers. Can be ID, username or TL object
 * @returns  The list of peers in the same order as the input
 */
export async function getPeers(client: ITelegramClient, chatIds: InputPeerLike[]): Promise<(Peer | null)[]> {
  const inputPeers = await resolvePeerMany(client, chatIds)

  // eslint-disable-next-line ts/await-thenable
  const res = await Promise.all(inputPeers.map(peer => peer ? _getRawPeerBatched(client, peer) : null))

  return res.map(it => it ? parsePeer(it) : null)
}
