import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { Chat, PeersIndex } from '../../types/index.js'

import { resolveChannel, resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface CommunityParticipantChats {
  /** Chats linked to the community that the participant has created */
  creatorChats: Chat[]

  /** Chats linked to the community that the participant has joined */
  joinedChats: Chat[]
}

/**
 * Get chats linked to a community that the given participant has joined or created
 */
export async function getCommunityParticipantChats(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Participant to fetch the chats for */
    participantId: InputPeerLike
  },
): Promise<CommunityParticipantChats> {
  const { communityId, participantId } = params

  const res = await client.call({
    _: 'communities.getParticipantJoinedChats',
    community: await resolveChannel(client, communityId),
    participant: await resolvePeer(client, participantId),
  })

  const peers = PeersIndex.from(res)

  return {
    creatorChats: res.creatorChatIds.map(it => new Chat(peers.chat(it))),
    joinedChats: res.joinedChatIds.map(it => new Chat(peers.chat(it))),
  }
}
