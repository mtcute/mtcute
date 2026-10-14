import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Remove an additional username from a bot the current user owns
 * (previously added with {@link addBotUsername})
 *
 * @param botId  Bot to remove the username from
 * @param username  Username to remove
 */
// @available=user
export async function removeBotUsername(
  client: ITelegramClient,
  botId: InputPeerLike,
  username: string,
): Promise<void> {
  const r = await client.call({
    _: 'bots.removeUsername',
    bot: await resolveUser(client, botId),
    username,
  })

  assertTrue('bots.removeUsername', r)
}
