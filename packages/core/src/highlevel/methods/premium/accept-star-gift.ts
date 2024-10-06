import type { ITelegramClient } from '../../client.types.js'
import { type InputMessageId, normalizeInputMessageId } from '../../types/messages/input-message-id.js'
import { resolveUser } from '../users/resolve-peer.js'

// @available=user
/**
 * Accept, hide or convert a star gift.
 *
 * @returns  Whether the action was successful
 */
export async function acceptStarGift(
    client: ITelegramClient,
    params: InputMessageId & {
        /**
         * Action to perform on the gift.
         *  - `save` - save the gift to your profile
         *  - `hide` - hide the gift from your profile
         *  - `convert` - convert the gift to stars (can't be undone)
         */
        action: 'save' | 'hide' | 'convert'
    },
): Promise<boolean> {
    const { action } = params
    const { chatId, message } = normalizeInputMessageId(params)
    const userId = await resolveUser(client, chatId)

    return client.call(
        action === 'convert'
            ? {
                _: 'payments.convertStarGift',
                userId,
                msgId: message,
            }
            : {
                _: 'payments.saveStarGift',
                unsave: action === 'hide',
                userId,
                msgId: message,
            },
    )
}
