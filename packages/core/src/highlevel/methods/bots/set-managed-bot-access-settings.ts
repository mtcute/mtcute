import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Set access settings of a bot managed by the current bot
 *
 * @param botId  ID of the managed bot
 */
export async function setManagedBotAccessSettings(
  client: ITelegramClient,
  botId: InputPeerLike,
  params: {
    /** Whether access to the bot should be restricted to its owner and {@link users} */
    restricted: boolean

    /** Users that can use the bot in addition to its owner (replaces the current list) */
    users?: InputPeerLike[]
  },
): Promise<void> {
  const r = await client.call({
    _: 'bots.editAccessSettings',
    restricted: params.restricted,
    bot: await resolveUser(client, botId),
    addUsers: params.users?.length
      ? await resolvePeerMany(client, params.users, toInputUser)
      : undefined,
  })

  assertTrue('bots.editAccessSettings', r)
}
