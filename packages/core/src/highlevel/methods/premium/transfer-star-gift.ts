import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { InputPeerLike } from '../../types/index.js'
import type { Message } from '../../types/messages/message.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolveUser } from '../users/resolve-peer.js'

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
        /** ID of the message containing the gift */
        message: number | Message

        /** ID of the user to transfer the gift to */
        recepient: InputPeerLike

        /**
         * Whether to dispatch the new message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { message, recepient, shouldDispatch } = params

    const msgId = typeof message === 'number' ? message : message.id
    const invoice: tl.TypeInputInvoice = {
        _: 'inputInvoiceStarGiftTransfer',
        msgId,
        toId: await resolveUser(client, recepient),
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
