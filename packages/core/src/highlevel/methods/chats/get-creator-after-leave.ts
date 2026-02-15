import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { User } from '../../types/peers/user.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Get the user who will be made the creator of the channel/supergroup if you were to leave it.
 *
 * You must be the creator of the channel/supergroup to use this method.
 */
export async function getCreatorAfterLeave(
  client: ITelegramClient,
  chatId: InputPeerLike,
): Promise<User | null> {
  const res = await client.call({
    _: 'channels.getFutureCreatorAfterLeave',
    channel: await resolveChannel(client, chatId),
  })

  if (res._ === 'userEmpty') return null

  return new User(res)
}
