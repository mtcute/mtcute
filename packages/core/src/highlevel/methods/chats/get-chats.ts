import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { Chat, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerChat, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

import { _getChannelsBatched, _getChatsBatched } from './batched-queries.js'

// @available=both
/**
 * Get basic information about multiple chats.
 *
 * @param chatIds  Chat identifiers. Can be ID, username or TL object
 * @returns  The list of chats in the same order as the input
 */
export async function getChats(client: ITelegramClient, chatIds: InputPeerLike[]): Promise<(Chat | null)[]> {
  const inputPeers = await resolvePeerMany(client, chatIds)

  // eslint-disable-next-line ts/await-thenable
  const res = await Promise.all(inputPeers.map((peer) => {
    if (!peer) return null
    if (isInputPeerChannel(peer)) {
      return _getChannelsBatched(client, toInputChannel(peer))
    } else if (isInputPeerChat(peer)) {
      return _getChatsBatched(client, peer.chatId)
    } else {
      throw new MtInvalidPeerTypeError(peer, 'chat or channel')
    }
  }))

  return res.map(it => (it ? new Chat(it) : null))
}
