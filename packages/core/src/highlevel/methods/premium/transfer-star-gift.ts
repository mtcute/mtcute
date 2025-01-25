import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { InputPeerLike, InputStarGift } from '../../types/index.js'
import type { Message } from '../../types/messages/message.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/**
 * Transfer a unique star gift.
 *
 * > **Note**: this method is not indended to be used by full-fledged clients,
 * > as this method hides the actual invoice and payment form from the user.
 * > For GUI clients, you should refer to the method's source code and
 * > present the payment form to the user.
 *
 * @returns  Service message about the transferred gift
 */
export async function transferStarGift(
    client: ITelegramClient,
    params: {
        /** Star gift to transfer */
        gift: InputStarGift

        /** ID of the user to transfer the gift to */
        recepient: InputPeerLike

        /**
         * Whether to dispatch the new message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { gift, recepient, shouldDispatch } = params

    const invoice: tl.TypeInputInvoice = {
        _: 'inputInvoiceStarGiftTransfer',
        stargift: await _normalizeInputStarGift(client, gift),
        toId: await resolvePeer(client, recepient),
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
