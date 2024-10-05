import Long from 'long'
import type { tl } from '@mtcute/tl'

import type { InputPeerLike } from '../../types/peers/peer.js'
import type { StarGift } from '../../types/premium/stars-gift.js'
import { type InputText, inputTextToTl } from '../../types/misc/entities.js'
import type { ITelegramClient } from '../../client.types.js'
import { resolveUser } from '../users/resolve-peer.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import type { Message } from '../../types/messages/message.js'

/**
 * Send a star gift to a user.
 *
 * > **Note**: this method is not indended to be used by full-fledged clients,
 * > as this method hides the actual invoice and payment form from the user.
 * > For GUI clients, you should refer to the method's source code and
 * > present the payment form to the user.
 *
 * @returns  Service message about the sent gift
 */
export async function sendStarGift(
    client: ITelegramClient,
    params: {
        /** ID of the user to send the gift to */
        userId: InputPeerLike

        /** ID of the gift to send */
        gift: Long | StarGift

        /**
         * Whether to send the gift anonymously
         * (i.e. if the recipient chooses to display the gift
         * on their profile, your name won't be visible)
         */
        anonymous?: boolean

        /** Message to send along with the gift */
        message?: InputText

        /**
         * Whether to dispatch the new message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { userId, gift, anonymous, message, shouldDispatch } = params

    const invoice: tl.TypeInputInvoice = {
        _: 'inputInvoiceStarGift',
        hideName: anonymous,
        userId: await resolveUser(client, userId),
        giftId: Long.isLong(gift) ? gift : gift.id,
        message: message ? inputTextToTl(message) : undefined,
    }

    const form = await client.call({
        _: 'payments.getPaymentForm',
        invoice,
    })

    const res = await client.call({
        _: 'payments.sendStarsForm',
        invoice,
        formId: form.formId,
    })

    assertTypeIs('payments.sendStarsForm', res, 'payments.paymentResult')

    return _findMessageInUpdate(client, res.updates, false, !shouldDispatch)
}
