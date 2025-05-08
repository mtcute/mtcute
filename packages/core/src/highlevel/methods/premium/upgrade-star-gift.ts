import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'

import type { Message } from '../../types/messages/message.js'
import { tl } from '@mtcute/tl'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/**
 * Upgrades a star gift to a unique gift.
 *
 * > **Note**: this method is not indended to be used by full-fledged clients,
 * > as this method hides the actual invoice and payment form from the user.
 * > For GUI clients, you should refer to the method's source code and
 * > present the payment form to the user.
 *
 * @returns  Service message about the upgraded gift, if one was generated.
 */
export async function upgradeStarGift(
    client: ITelegramClient,
    params: {
        gift: InputStarGift

        /**
         * Whether to retain the original details of the gift
         * (like sender, recipient, date, message)
         */
        keepOriginalDetails?: boolean

        /**
         * Whether to dispatch the new message event
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message | null> {
    const { gift, keepOriginalDetails, shouldDispatch } = params

    const invoice: tl.TypeInputInvoice = {
        _: 'inputInvoiceStarGiftUpgrade',
        stargift: await _normalizeInputStarGift(client, gift),
        keepOriginalDetails,
    }

    let updates: tl.TypeUpdates
    try {
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

        updates = res.updates
    } catch (e) {
        if (tl.RpcError.is(e, 'NO_PAYMENT_NEEDED')) {
            updates = await client.call({
                _: 'payments.upgradeStarGift',
                stargift: invoice.stargift,
                keepOriginalDetails: invoice.keepOriginalDetails,
            })
        } else {
            throw e
        }
    }

    return _findMessageInUpdate(client, updates, false, !shouldDispatch, true)
}
