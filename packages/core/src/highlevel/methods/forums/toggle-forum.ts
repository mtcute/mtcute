import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Update forum settings of a supergroup.
 *
 * Only owner of the supergroup can change this setting.
 *
 * @param chatId  Chat ID or username
 * @param settings  New settings. `null` is a shorthand for `{ isForum: false }`
 */
export async function updateForumSettings(
  client: ITelegramClient,
  chatId: InputPeerLike,
  settings: null | {
    /** Whether the supergroup should be a forum */
    isForum: boolean
    threadsMode: 'list' | 'tabs'
  },
): Promise<void> {
  const res = await client.call({
    _: 'channels.toggleForum',
    channel: await resolveChannel(client, chatId),
    enabled: settings?.isForum ?? false,
    tabs: settings?.threadsMode === 'tabs',
  })
  client.handleClientUpdate(res)
}
