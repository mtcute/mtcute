import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set whether a chat has content protection (i.e. forwarding messages is disabled)
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether content protection should be enabled
 */
export async function toggleContentProtection(
  client: ITelegramClient,
  chatId: InputPeerLike,
  enabled = false,
  params?: {
    /** If this method was called in response to the other party enabling content protection, ID of that message */
    requestMsgId?: number
  },
): Promise<void> {
  const res = await client.call({
    _: 'messages.toggleNoForwards',
    peer: await resolvePeer(client, chatId),
    enabled,
    requestMsgId: params?.requestMsgId,
  })
  client.handleClientUpdate(res)
}
