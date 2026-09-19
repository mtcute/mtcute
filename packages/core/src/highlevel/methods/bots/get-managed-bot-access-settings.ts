import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { BotAccessSettings } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Get access settings of a bot managed by the current bot
 *
 * @param botId  ID of the managed bot
 */
export async function getManagedBotAccessSettings(
  client: ITelegramClient,
  botId: InputPeerLike,
): Promise<BotAccessSettings> {
  const res = await client.call({
    _: 'bots.getAccessSettings',
    bot: await resolveUser(client, botId),
  })

  return new BotAccessSettings(res)
}
