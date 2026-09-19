import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Get the token of a bot managed by the current bot
 *
 * @param botId  ID of the managed bot
 */
export async function getManagedBotToken(
  client: ITelegramClient,
  botId: InputPeerLike,
  params?: {
    /** Whether to revoke the current token and generate a new one */
    revoke?: boolean
  },
): Promise<string> {
  const res = await client.call({
    _: 'bots.exportBotToken',
    bot: await resolveUser(client, botId),
    revoke: params?.revoke ?? false,
  })

  return res.token
}
