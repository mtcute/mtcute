import { ITelegramClient } from '../../client.types.js'
import { InputMessageId, normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Unpin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 *
 * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
 * @param messageId  Message ID
 */
export async function unpinMessage(client: ITelegramClient, params: InputMessageId): Promise<void> {
    const { chatId, message } = normalizeInputMessageId(params)

    const res = await client.call({
        _: 'messages.updatePinnedMessage',
        peer: await resolvePeer(client, chatId),
        id: message,
        unpin: true,
    })

    client.handleClientUpdate(res)
}
