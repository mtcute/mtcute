import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveChannel, resolvePeer } from '../users/resolve-peer.js'

/**
 * Link a chat to a community, or update the visibility of an existing link
 */
export async function linkCommunityPeer(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Chat to link to the community */
    peerId: InputPeerLike

    /** Whether the chat should be hidden in the community's peer list */
    hidden?: boolean
  },
): Promise<void> {
  const { communityId, peerId, hidden } = params

  const r = await client.call({
    _: 'communities.togglePeerLink',
    community: await resolveChannel(client, communityId),
    peer: await resolvePeer(client, peerId),
    visible: !hidden || undefined,
    hidden: hidden || undefined,
  })

  assertTrue('communities.togglePeerLink', r)
}

/**
 * Unlink a chat from a community
 */
export async function unlinkCommunityPeer(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Chat to unlink from the community */
    peerId: InputPeerLike
  },
): Promise<void> {
  const { communityId, peerId } = params

  const r = await client.call({
    _: 'communities.togglePeerLink',
    community: await resolveChannel(client, communityId),
    peer: await resolvePeer(client, peerId),
    deleted: true,
  })

  assertTrue('communities.togglePeerLink', r)
}
