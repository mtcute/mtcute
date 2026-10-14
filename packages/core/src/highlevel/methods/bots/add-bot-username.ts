import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Add an additional username to a bot the current user owns
 *
 * @param botId  Bot to add the username to
 * @param username  Username to add
 */
// @available=user
export async function addBotUsername(client: ITelegramClient, botId: InputPeerLike, username: string): Promise<void> {
  const r = await client.call({
    _: 'bots.addUsername',
    bot: await resolveUser(client, botId),
    username,
  })

  assertTrue('bots.addUsername', r)
}
