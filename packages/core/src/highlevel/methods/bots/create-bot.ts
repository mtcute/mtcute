import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { User } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Create a new bot owned by the current user, which will be managed by another bot
 * (e.g. after pressing a button created with {@link BotKeyboard.requestManagedBot})
 *
 * @returns  The created bot
 */
export async function createBot(
  client: ITelegramClient,
  params: {
    /** Bot that will manage the created bot */
    manager: InputPeerLike

    /** Name of the bot (1-64 characters) */
    name: string

    /**
     * Username of the bot (must end with `bot`).
     * Use {@link checkBotUsername} to check if it is available
     */
    username: string

    /** Whether the bot is created from a `t.me/newbot` deep link */
    viaDeeplink?: boolean
  },
): Promise<User> {
  const res = await client.call({
    _: 'bots.createBot',
    viaDeeplink: params.viaDeeplink,
    name: params.name,
    username: params.username,
    managerId: await resolveUser(client, params.manager),
  })

  return new User(res)
}
