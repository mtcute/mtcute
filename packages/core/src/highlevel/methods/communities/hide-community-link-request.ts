import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveChannel, resolvePeer } from '../users/resolve-peer.js'

/**
 * Approve or decline a peer link request to a community
 */
export async function hideCommunityLinkRequest(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Peer whose link request should be approved/declined */
    peerId: InputPeerLike

    /** Whether to approve or decline the request */
    action: 'approve' | 'decline'
  },
): Promise<void> {
  const { communityId, peerId, action } = params

  const r = await client.call({
    _: 'communities.togglePeerLinkRequestApproval',
    community: await resolveChannel(client, communityId),
    peer: await resolvePeer(client, peerId),
    reject: action === 'decline' || undefined,
  })

  assertTrue('communities.togglePeerLinkRequestApproval', r)
}

/**
 * Approve or decline all pending peer link requests to a community
 */
export async function hideAllCommunityLinkRequests(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Whether to approve or decline the requests */
    action: 'approve' | 'decline'
  },
): Promise<void> {
  const { communityId, action } = params

  const r = await client.call({
    _: 'communities.toggleAllPeerLinkRequestApproval',
    community: await resolveChannel(client, communityId),
    reject: action === 'decline' || undefined,
  })

  assertTrue('communities.toggleAllPeerLinkRequestApproval', r)
}
