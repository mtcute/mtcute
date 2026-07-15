import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginated, InputPeerLike } from '../../types/index.js'

import { CommunityPeerRequest, PeersIndex } from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Get pending peer link requests for a community
 *
 * @param communityId  Community ID
 */
export async function getCommunityLinkRequests(
  client: ITelegramClient,
  communityId: InputPeerLike,
  params?: {
    /** Offset for pagination */
    offset?: string

    /**
     * Maximum number of requests to fetch
     *
     * @default  100
     */
    limit?: number
  },
): Promise<ArrayPaginated<CommunityPeerRequest, string>> {
  const { offset = '', limit = 100 } = params ?? {}

  const res = await client.call({
    _: 'communities.getPeerLinkRequests',
    community: await resolveChannel(client, communityId),
    offset,
    limit,
  })

  const peers = PeersIndex.from(res)

  return makeArrayPaginated(
    res.requests.map(it => new CommunityPeerRequest(it, peers)),
    res.totalCount,
    res.nextOffset,
  )
}
