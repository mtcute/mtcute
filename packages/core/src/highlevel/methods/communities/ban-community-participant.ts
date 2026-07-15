import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveChannel, resolvePeer } from '../users/resolve-peer.js'

/**
 * Ban a participant from a community
 */
export async function banCommunityParticipant(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Participant to ban */
    participantId: InputPeerLike
  },
): Promise<void> {
  const { communityId, participantId } = params

  const r = await client.call({
    _: 'communities.toggleParticipantBanned',
    community: await resolveChannel(client, communityId),
    participant: await resolvePeer(client, participantId),
  })

  assertTrue('communities.toggleParticipantBanned', r)
}

/**
 * Unban a participant from a community
 */
export async function unbanCommunityParticipant(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Participant to unban */
    participantId: InputPeerLike
  },
): Promise<void> {
  const { communityId, participantId } = params

  const r = await client.call({
    _: 'communities.toggleParticipantBanned',
    community: await resolveChannel(client, communityId),
    participant: await resolvePeer(client, participantId),
    unban: true,
  })

  assertTrue('communities.toggleParticipantBanned', r)
}
