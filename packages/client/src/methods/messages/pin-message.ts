import { BaseTelegramClient, MtTypeAssertionError } from '@mtcute/core'

import { InputMessageId, Message, normalizeInputMessageId } from '../../types'
import { resolvePeer } from '../users/resolve-peer'
import { _findMessageInUpdate } from './find-in-update'

/**
 * Pin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 *
 * @returns  Service message about pinned message, if one was generated.
 */
export async function pinMessage(
    client: BaseTelegramClient,
    params: InputMessageId & {
        /** Whether to send a notification (only for legacy groups and supergroups) */
        notify?: boolean
        /** Whether to pin for both sides (only for private chats) */
        bothSides?: boolean

        /**
         * Whether to dispatch the returned service message (if any)
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message | null> {
    const { notify, bothSides, shouldDispatch } = params ?? {}
    const { chatId, message } = normalizeInputMessageId(params)

    const res = await client.call({
        _: 'messages.updatePinnedMessage',
        peer: await resolvePeer(client, chatId),
        id: message,
        silent: !notify,
        pmOneside: !bothSides,
    })

    try {
        return _findMessageInUpdate(client, res, false, !shouldDispatch)
    } catch (e) {
        if (e instanceof MtTypeAssertionError && e.context === '_findInUpdate (@ .updates[*])') {
            // no service message
            return null
        }

        throw e
    }
}
