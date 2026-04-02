import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { MtInvalidPeerTypeError } from '../../types/errors.js'
import { User } from '../../types/peers/user.js'
import { isInputPeerUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get the user who will be made the creator of the chat/channel/supergroup if you were to leave it.
 *
 * You must be the creator of the chat/channel/supergroup to use this method.
 */
export async function getCreatorAfterLeave(
  client: ITelegramClient,
  chatId: InputPeerLike,
): Promise<User | null> {
  const peer = await resolvePeer(client, chatId)

  if (isInputPeerUser(peer)) {
    throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
  }

  const res = await client.call({
    _: 'messages.getFutureChatCreatorAfterLeave',
    peer,
  })

  if (res._ === 'userEmpty') return null

  return new User(res)
}
