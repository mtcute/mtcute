import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import Long from 'long'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { EphemeralMessage } from '../../types/index.js'
import { _buildPeersIndex } from '../chats/build-peers-index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Get the welcome messages configured for a chat
 *
 * @param chatId  Chat to get the welcome messages for
 */
export async function getWelcomeMessages(
  client: ITelegramClient,
  chatId: InputPeerLike,
): Promise<EphemeralMessage[]> {
  const peer = await resolvePeer(client, chatId)

  const res = await client.call({
    _: 'ephemeral.getWelcomeMessages',
    peer,
    hash: Long.ZERO,
  })

  assertTypeIsNot(res, 'ephemeral.welcomeMessagesNotModified')

  // the response doesn't contain any peers, so we have to fetch them ourselves
  const peersToFetch: (tl.TypePeer | tl.TypeInputPeer)[] = [peer]
  for (const msg of res.messages) {
    peersToFetch.push(msg.fromId)
    if (msg.peerId) peersToFetch.push(msg.peerId)
  }

  const peers = await _buildPeersIndex(client, peersToFetch)

  return res.messages.map(it => new EphemeralMessage(it, peers))
}
