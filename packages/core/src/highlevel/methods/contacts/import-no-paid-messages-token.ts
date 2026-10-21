import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { User } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

// @available=user
/**
 * Use a token from a link exported with {@link exportNoPaidMessagesToken}
 * to be able to send messages to the given user for free.
 *
 * Repeated calls have no effect.
 *
 * @param userId  User who exported the token
 * @param token  The token
 */
export async function importNoPaidMessagesToken(
  client: ITelegramClient,
  userId: InputPeerLike,
  token: string,
): Promise<User> {
  const res = await client.call({
    _: 'contacts.importNoPaidMessagesToken',
    userId: await resolveUser(client, userId),
    token,
  })

  assertTypeIs(res, 'user')

  return new User(res)
}
