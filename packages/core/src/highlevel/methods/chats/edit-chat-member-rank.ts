import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Edit the custom rank (title) of a group chat participant.
 */
export async function editChatMemberRank(
  client: ITelegramClient,
  params: {
    /** Chat ID */
    chatId: InputPeerLike
    /** ID of the user to edit the rank of */
    participantId: InputPeerLike
    /** New rank, or `null` to remove it */
    rank: string | null
  },
): Promise<void> {
  const { chatId, participantId, rank } = params

  const res = await client.call({
    _: 'messages.editChatParticipantRank',
    peer: await resolvePeer(client, chatId),
    participant: await resolvePeer(client, participantId),
    rank: rank ?? '',
  })

  client.handleClientUpdate(res)
}
