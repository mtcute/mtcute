import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Set whether a supergroup is a forum.
 *
 * Only owner of the supergroup can change this setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether the supergroup should be a forum
 * @deprecated Use {@link updateForumSettings} instead
 */
export async function toggleForum(client: ITelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleForum',
        channel: await resolveChannel(client, chatId),
        enabled,
        tabs: false,
    })
    client.handleClientUpdate(res)
}

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
