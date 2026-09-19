import type { ITelegramClient } from '../../client.types.js'

/**
 * Check whether a username can be used for a new bot
 * (e.g. when creating it via {@link createBot})
 *
 * @param username  Username to check (must end with `bot`)
 */
export async function checkBotUsername(client: ITelegramClient, username: string): Promise<boolean> {
  return client.call({
    _: 'bots.checkUsername',
    username,
  })
}
