import { BaseTelegramClient } from '@mtcute/core'

import { InputMessageId, normalizeInputMessageId } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Pin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 */
export async function pinMessage(
    client: BaseTelegramClient,
    params: InputMessageId & {
        /** Whether to send a notification (only for legacy groups and supergroups) */
        notify?: boolean
        /** Whether to pin for both sides (only for private chats) */
        bothSides?: boolean
    },
): Promise<void> {
    const { notify, bothSides } = params ?? {}
    const { chatId, message } = normalizeInputMessageId(params)

    const res = await client.call({
        _: 'messages.updatePinnedMessage',
        peer: await resolvePeer(client, chatId),
        id: message,
        silent: !notify,
        pmOneside: !bothSides,
    })

    client.network.handleUpdate(res)
}
