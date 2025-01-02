import type { ITelegramClient } from '../../client.types.js'
import type { Message } from '../../types/messages/message.js'

// @available=user
/**
 * Accept, hide or convert a star gift.
 *
 * @returns  Whether the action was successful
 */
export async function acceptStarGift(
    client: ITelegramClient,
    params: {
        /** ID of the message containing the gift */
        message: number | Message
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
    const message = typeof params.message === 'number' ? params.message : params.message.id

    return client.call(
        action === 'convert'
            ? {
                _: 'payments.convertStarGift',
                msgId: message,
            }
            : {
                _: 'payments.saveStarGift',
                unsave: action === 'hide',
                msgId: message,
            },
    )
}
